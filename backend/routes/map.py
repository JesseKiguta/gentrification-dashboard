from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
import joblib
import os
import json

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # project root when placed in routes/
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

# Use the same model filenames as in app.py
MODEL_FILES = {
    "rf": "RandomForest_model.joblib",
    "xgb": "XGBoost_model.joblib",
    "mlp": "MLP_model.joblib"
}

models_map = {}
for key, fname in MODEL_FILES.items():
    path = os.path.join(MODELS_DIR, fname)
    if os.path.exists(path):
        try:
            models_map[key] = joblib.load(path)
        except Exception as e:
            print(f"Error loading {key} from {path}: {e}")
    else:
        print(f"Model file not found for map route: {path}")

# Subcounty normalize map (keeps same parent mapping for embakasi)
SUBCOUNTY_PARENT = {
    "embakasi north": "embakasi",
    "embakasi south": "embakasi",
    "embakasi east": "embakasi",
    "embakasi west": "embakasi",
    "embakasi central": "embakasi"
}

AVAILABLE_SUBCOUNTIES = [
    "embakasi", "kasarani", "langata", "makadara", "westlands"
]

# authoritative FEATURES list (must match app.py)
RAW_FEATURES = [
    "Rent", "Food", "Transport", "Utilities", "Misc",
    "pop_density", "employment_rate", "median_income",
    "household_size", "dist_to_cbd_km", "neighbors",
    "year", "month", "quarter",
    "Subcounty_clean"   # keep raw column only
]

# -------------------------------
# Helper: normalize subcounty input
# -------------------------------
def normalize_subcounty(name: str) -> str:
    n = name.strip().lower()
    if n.startswith("embakasi"):
        return "embakasi"
    if n in AVAILABLE_SUBCOUNTIES:
        return n
    # check parent mapping
    if n in SUBCOUNTY_PARENT:
        return SUBCOUNTY_PARENT[n]
    return n  # caller will validate further

# -------------------------------
# Route: /map-predictions
# -------------------------------
@router.get("/map-predictions")
def map_predictions(subcounty: str, model: str = "rf", year: int | None = None):
    model = model.lower()
    if model not in models_map:
        raise HTTPException(status_code=400, detail=f"Invalid model '{model}'")

    # Normalize subcounty
    sub_norm = normalize_subcounty(subcounty)
    if sub_norm not in AVAILABLE_SUBCOUNTIES:
        raise HTTPException(status_code=400, detail=f"Subcounty '{subcounty}' not supported")

    # Load JSON
    ref_path = os.path.join(DATA_DIR, "subcounty_reference_updated.json")
    if not os.path.exists(ref_path):
        raise HTTPException(
            status_code=500,
            detail="Reference file data/subcounty_reference_updated.json not found. Run the generator script."
        )

    with open(ref_path, "r", encoding="utf-8") as f:
        ref = json.load(f)

    if sub_norm not in ref:
        raise HTTPException(status_code=404, detail=f"No reference data for subcounty '{sub_norm}'")

    # Choose year
    years_available = sorted([int(y) for y in ref[sub_norm].keys()])
    if not years_available:
        raise HTTPException(status_code=404, detail=f"No yearly data for subcounty '{sub_norm}'")

    if year is None:
        chosen_year = str(max(years_available))
    else:
        if year not in years_available:
            raise HTTPException(
                status_code=404,
                detail=f"Year {year} not available for subcounty '{sub_norm}'"
            )
        chosen_year = str(year)

    # ------------------------
    # Directly use the raw JSON numbers (not features_mean)
    # ------------------------
    entry = ref[sub_norm][chosen_year]

    # Build the input row using RAW_FEATURES
    row = {}
    for feat in RAW_FEATURES:
        if feat == "Subcounty_clean":
            row[feat] = sub_norm
        else:
            # direct from JSON
            row[feat] = entry.get(feat, 0)

    X = pd.DataFrame([row])

    # Predict
    model_pipeline = models_map[model]
    try:
        score = float(model_pipeline.predict(X)[0])

        # You can replace these later with quantile bins if you want
        if score < -0.05:
            risk = "Low"
        elif score < 0.05:
            risk = "Medium"
        else:
            risk = "High"

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting: {e}")

    return {
        "subcounty": sub_norm,
        "year": int(chosen_year),
        "model": model,
        "score": score,
        "risk_category": risk,
        "features_used": row  # useful for debugging
    }

