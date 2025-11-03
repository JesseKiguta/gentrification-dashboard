from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import os
from typing import Dict, Any
from utils.model_inference import predict_gentrification
from auth import authenticate_user, create_access_token


BASE_DIR = os.path.dirname(__file__)
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# load models at startup
models = {}
model_names = [
    ("Random Forest", "random_forest_best.joblib"),
    ("XGBoost", "xgboost_best.joblib"),
    ("MLP", "mlp_best.joblib"),
]
for disp, fname in model_names:
    path = os.path.join(MODELS_DIR, fname)
    if os.path.exists(path):
        try:
            models[disp] = joblib.load(path)
        except Exception:
            # if loading fails, skip but warn
            print(f"Warning: failed to load model: {path}")
    else:
        print(f"Warning: model file not found: {path}")

# infer features from first available model
FEATURES = []
for m in models.values():
    if hasattr(m, "feature_names_in_"):
        FEATURES = list(m.feature_names_in_)
        break

class LoginPayload(BaseModel):
    username: str
    password: str

class PredictPayload(BaseModel):
    model: str
    features: Dict[str, Any]

@app.post("/login")
def login(payload: LoginPayload):
    if authenticate_user(payload.username, payload.password):
        token = create_access_token({"sub": payload.username})
        return {"access_token": token}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/features")
def get_features():
    """Return the feature list (for frontend form generation)"""
    return {"features": FEATURES}

@app.post("/predict")
def predict(payload: PredictPayload):
    if payload.model not in models:
        raise HTTPException(status_code=400, detail="Model not found")
    model = models[payload.model]
    df = pd.DataFrame([payload.features])
    try:
        preds = predict_gentrification(model, df)
        return {"prediction": float(preds[0])}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/compare")
def compare(payload: PredictPayload):
    # returns predictions across all models
    df = pd.DataFrame([payload.features])
    out = {}
    for name, model in models.items():
        try:
            p = predict_gentrification(model, df)
            out[name] = float(p[0])
        except Exception:
            out[name] = None
    return out

@app.get("/geojson")
def get_geojson():
    path = os.path.join(DATA_DIR, "nairobi_subcounties.geojson")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="GeoJSON not found")
    import json
    with open(path, "r", encoding="utf-8") as f:
        gj = json.load(f)
    return gj

@app.get("/insights")
def insights():
    # placeholder: return dummy feature importances or shap summary
    # if you compute SHAP server-side, expose it here
    sample = {f: float(i + 1) for i, f in enumerate(FEATURES[:10])}
    return {"feature_importances": sample}

