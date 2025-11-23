from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import joblib
import json
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from fastapi import Query
from datetime import datetime, timezone
import textwrap

from auth import authenticate_user, create_access_token
from routes.map import router as map_router


# -------------------------------------------------------------------
# PATHS
# -------------------------------------------------------------------
BASE_DIR = os.path.dirname(__file__)
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")
PLOTS_DIR = os.path.join(BASE_DIR, "plots")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

os.makedirs(REPORTS_DIR, exist_ok=True)


# -------------------------------------------------------------------
# FEATURES (must match the pipeline input names EXACTLY)
# -------------------------------------------------------------------
FEATURES = [
    "Rent", "Food", "Transport", "Utilities", "Misc",
    "pop_density", "employment_rate", "median_income",
    "household_size", "dist_to_cbd_km", "neighbors",
    "year", "month", "quarter",

    # One-hot from Subcounty_clean
    "Subcounty_clean_embakasi",
    "Subcounty_clean_kasarani",
    "Subcounty_clean_langata",
    "Subcounty_clean_makadara",
    "Subcounty_clean_westlands"
]

VALID_SUBCOUNTIES = [
    "embakasi", "kasarani", "langata", "makadara", "westlands"
]


# -------------------------------------------------------------------
# FASTAPI SETUP
# -------------------------------------------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(map_router, prefix="/api")


# -------------------------------------------------------------------
# LOAD MODELS
# -------------------------------------------------------------------
MODEL_FILES = {}
# -------------------------------------------------------------------
# LOAD MODELS
# -------------------------------------------------------------------
MODEL_FILES = {
    "Random Forest": "RandomForest_model.joblib",
    "XGBoost": "XGBoost_model.joblib",
    "MLP": "MLP_model.joblib",
}

models = {}

for name, fname in MODEL_FILES.items():
    full_path = os.path.join(MODELS_DIR, fname)
    if os.path.exists(full_path):
        try:
            models[name] = joblib.load(full_path)
        except Exception as e:
            print(f"Error loading model {name}: {e}")
    else:
        print(f"Warning: missing model file {full_path}")


# Must match FEATURE NAMES — corrected!
# -------------------------------------------------------------------
class ModelInput(BaseModel):
    Rent: float
    Food: float
    Transport: float
    Utilities: float
    Misc: float
    pop_density: float
    employment_rate: float
    median_income: float
    household_size: float
    dist_to_cbd_km: float
    neighbors: int
    year: int
    month: int
    quarter: int
    Subcounty_clean: str

    def to_dataframe(self) -> pd.DataFrame:
        """Convert to a single-row DataFrame with raw features."""
        subcounty = self.Subcounty_clean.strip().lower()
        if subcounty not in VALID_SUBCOUNTIES:
            raise ValueError(
                f"Invalid subcounty: {self.Subcounty_clean}. Must be one of {VALID_SUBCOUNTIES}"
            )

        # Return DataFrame with raw features only; pipeline will handle OHE
        data = self.model_dump()
        data["Subcounty_clean"] = subcounty  # normalized
        return pd.DataFrame([data])

class LoginPayload(BaseModel):
    username: str
    password: str


class CompareRequest(BaseModel):
    models: List[str]
    features: Dict[str, Any]


# -------------------------------------------------------------------
# LOGIN
# -------------------------------------------------------------------
@app.post("/login")
def login(payload: LoginPayload):
    if authenticate_user(payload.username, payload.password):
        token = create_access_token({"sub": payload.username})
        return {"access_token": token}
    raise HTTPException(status_code=401, detail="Invalid credentials")


# -------------------------------------------------------------------
# FEATURES
# -------------------------------------------------------------------
@app.get("/features")
def get_features():
    return {"features": FEATURES}


# -------------------------------------------------------------------
# RISK BUCKETING
# -------------------------------------------------------------------
def bucket_risk(score: float):
    if score < -0.05:
        return "Low"
    elif score < 0.05:
        return "Medium"
    return "High"


# -------------------------------------------------------------------
# PREDICTION ENDPOINT
# -------------------------------------------------------------------
@app.post("/predict")
def predict(input_data: ModelInput, model_name: str = "Random Forest"):

    if model_name not in models:
        raise HTTPException(status_code=400, detail=f"Invalid model name: {model_name}")

    try:
        df = input_data.to_dataframe()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    score = float(models[model_name].predict(df)[0])
    risk = bucket_risk(score)

    return {"model": model_name, "score": score, "risk_category": risk}


# -------------------------------------------------------------------
# COMPARE ENDPOINT
# -------------------------------------------------------------------
@app.post("/compare")
def compare_models(request: CompareRequest):
    results = {}

    # Wrap feature DataFrame creation with validation
    try:
        # Reuse ModelInput for validation if possible
        input_obj = ModelInput(**request.features)
        df = input_obj.to_dataframe()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid feature input: {e}")

    for name in request.models:
        if name not in models:
            raise HTTPException(status_code=400, detail=f"Model '{name}' not found")

        score = float(models[name].predict(df)[0])
        results[name] = {
            "score": score,
            "risk_category": bucket_risk(score)
        }

    return results


# -------------------------------------------------------------------
# GEOJSON
# -------------------------------------------------------------------
@app.get("/geojson")
def get_geojson():
    path = os.path.join(DATA_DIR, "nairobi_subcounties.geojson")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="GeoJSON file missing")

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# -------------------------------------------------------------------
# FEATURE IMPORTANCE PNGs
# -------------------------------------------------------------------
@app.get("/feature-importance")
def feature_importance(model: str = "Random Forest"):
    files = {
        "Random Forest": "rf_fi.png",
        "XGBoost": "xgb_fi.png",
        "MLP": "mlp_fi.png"
    }

    if model not in files:
        raise HTTPException(status_code=400, detail="Invalid model name")

    file_path = os.path.join(PLOTS_DIR, files[model])

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Plot not found")

    return FileResponse(file_path, media_type="image/png")


# -------------------------------------------------------------------
# INSIGHTS.JSON
# -------------------------------------------------------------------
@app.get("/insights")
def insights():

    path = os.path.join(DATA_DIR, "insights.json")

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="insights.json missing")

    return json.load(open(path))


# -------------------------------------------------------------------
# NEW: GENERATE REPORT (PDF)
# -------------------------------------------------------------------
@app.post("/generate-report")
def generate_report(
    input_data: ModelInput,
    model_name: str = "Random Forest",
    subcounty: str | None = Query(None, description="Subcounty name, e.g., 'embakasi'"),
    year: int | None = None,
    top_n: int = 5
):
    if model_name not in models:
        raise HTTPException(status_code=400, detail=f"Model '{model_name}' not found")

    # Normalize and validate subcounty
    if subcounty and subcounty not in VALID_SUBCOUNTIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid subcounty: {subcounty}. Must be one of {VALID_SUBCOUNTIES}"
        )
    if subcounty:
        input_data.Subcounty_clean = subcounty

    # Convert input to DataFrame
    try:
        df = input_data.to_dataframe()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Predict
    model = models[model_name]
    score = float(model.predict(df)[0])
    risk = bucket_risk(score)

    # Prediction summary paragraph
    pred_summary = (
        f"The predicted gentrification risk score using {model_name} is {score:.4f}, "
        f"which corresponds to a '{risk}' risk category. "
        "This prediction reflects the combined influence of socio-economic, expenditure, "
        "and spatial features for the given subcounty and time context."
    )

    # Prepare PDF
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    fname = f"report_{model_name.replace(' ', '_')}_{ts}.pdf"
    out_path = os.path.join(REPORTS_DIR, fname)
    c = canvas.Canvas(out_path, pagesize=A4)
    width, height = A4
    margin = 36
    bottom_margin = 50
    y_cursor = height - 50

    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin, y_cursor, "Gentrification Risk Report")
    y_cursor -= 30
    c.setFont("Helvetica", 12)
    c.drawString(margin, y_cursor, f"Model: {model_name}")
    y_cursor -= 25
    c.drawString(margin, y_cursor, f"Generated: {ts} (UTC)")
    y_cursor -= 25

    # Prediction section
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y_cursor, "Prediction")
    y_cursor -= 25
    c.setFont("Helvetica", 12)
    c.drawString(margin, y_cursor, f"Score: {score:.4f}")
    y_cursor -= 25
    c.drawString(margin, y_cursor, f"Risk Category: {risk}")
    y_cursor -= 25

    # Utility: wrapped paragraph drawer
    def draw_paragraph(text, max_width):
        nonlocal y_cursor
        lines = c.beginText(margin, y_cursor)
        lines.setFont("Helvetica", 12)
        for line in textwrap.wrap(text, width=90):
            if y_cursor <= bottom_margin:
                c.showPage()
                y_cursor = height - margin
                lines = c.beginText(margin, y_cursor)
                lines.setFont("Helvetica", 12)
            lines.textLine(line)
            y_cursor -= 12
        c.drawText(lines)

    # Draw prediction summary
    draw_paragraph(pred_summary, width - 2*margin)
    y_cursor -= 25

    # Context section
    if subcounty or year:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin, y_cursor, "Context")
        y_cursor -= 25
        c.setFont("Helvetica", 12)
        if subcounty:
            c.drawString(margin, y_cursor, f"Subcounty: {subcounty}")
            y_cursor -= 25
        if year:
            c.drawString(margin, y_cursor, f"Year: {year}")
            y_cursor -= 25
        y_cursor -= 5

    # Feature Importance resources
    model_image_map = {
        "Random Forest": "rf_fi.png",
        "XGBoost": "xgb_fi.png",
        "MLP": "mlp_fi.png"
    }
    model_top_features = {
        "Random Forest": ["Rent", "Food", "Misc"],
        "XGBoost": ["median_income", "employment_rate", "pop_density"],
        "MLP": ["Rent", "employment_rate", "dist_to_cbd_km"]
    }

    reasoning = {
        "Rent": "Higher rent indicates increasing economic pressure, which can push out lower income groups.",
        "Food": "Higher food expenditure reflects overall household cost burdens that relate to affordability constraints.",
        "Misc": "Miscellaneous expenditures capture other financial pressures that may influence displacement vulnerability.",
        "median_income": "Higher median income typically reduces displacement risk by indicating improved financial stability.",
        "employment_rate": "Higher employment rates often lower vulnerability to gentrification forces by improving household resilience.",
        "pop_density": "High density areas tend to face stronger housing competition, which can magnify gentrification pressures.",
        "dist_to_cbd_km": "Areas closer to the CBD tend to have higher demand, increasing potential gentrification pressure."
    }

    # Feature importance plot + summary
    img_name = model_image_map.get(model_name)
    if img_name:
        img_path = os.path.join(PLOTS_DIR, img_name)
        if os.path.exists(img_path):

            img_height = 200
            img_width = 520

            if y_cursor - img_height - 60 < bottom_margin:
                c.showPage()
                y_cursor = height - margin

            # Title
            c.setFont("Helvetica-Bold", 11)
            c.drawString(margin, y_cursor, f"{model_name} Feature Importance")
            y_cursor -= 15

            # Plot
            c.drawImage(img_path, margin, y_cursor - img_height, width=img_width,
                        height=img_height, preserveAspectRatio=True, mask='auto')
            y_cursor -= img_height + 20  # add extra spacing

            # Expanded reasoning summary (not bold)
            top_feats = model_top_features.get(model_name, [])

            if top_feats:
                explanation_parts = []
                for feat in top_feats:
                    if feat in reasoning:
                        explanation_parts.append(f"{feat}: {reasoning[feat]}")
                expanded_reasoning = (
                    f"The plot above shows the relative importance of features used by {model_name}. "
                    f"The top {len(top_feats)} features are: "
                    f"{', '.join(top_feats)}. "
                    "The following is a breakdown of how each contributes to the model:\n\n"
                    + "\n".join(explanation_parts)
                )
            else:
                expanded_reasoning = (
                    f"This plot displays the feature importance distribution for {model_name}."
                )

            draw_paragraph(expanded_reasoning, width - 2*margin)

    # Finalize
    c.showPage()
    c.save()

    return FileResponse(out_path, media_type="application/pdf", filename=fname)


