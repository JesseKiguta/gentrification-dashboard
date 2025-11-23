# Gentrification Risk Monitoring Dashboard

---

## Table of contents

- [Project overview](#project-overview)
- [Key features](#key-features)
- [Architecture](#architecture)
- [Backend](#backend)
  - [API endpoints](#api-endpoints)
  - [Model pipelines](#model-pipelines)
  - [Data files and reference JSONs](#data-files-and-reference-jsons)
- [Frontend](#frontend)
  - [Main pages & components](#main-pages--components)
  - [Interaction flows](#interaction-flows)
- [Dataset & preprocessing](#dataset--preprocessing)
  - [Features](#features)
  - [Feature engineering and cleaning](#feature-engineering-and-cleaning)
  - [Preprocessing pipeline](#preprocessing-pipeline)
- [Models & performance](#models--performance)
  - [Model types](#model-types)
  - [How predictions are converted to risk buckets](#how-predictions-are-converted-to-risk-buckets)
- [Deployment & running locally](#deployment--running-locally)
- [How to contribute](#how-to-contribute)
- [Privacy & ethics](#privacy--ethics)
- [Appendix: Example payloads](#appendix-example-payloads)

---

## Project overview

This repository implements an end-to-end monitoring dashboard for estimating **gentrification risk** at the Nairobi subcounty level. It pairs a machine learning backend (FastAPI) with a React frontend to provide prediction, model comparison, geospatial mapping, and PDF reporting capabilities.

The primary goal is to offer stakeholders an exploratory and operational tool that helps identify neighborhoods potentially at risk of gentrification, by combining expenditure, socio-economic, spatial and temporal data into an interpretable risk score.

---

## Key features

- Single-record prediction endpoint (choose model) and a compare endpoint that runs the same input through multiple models.
- Map view with subcounty-level predictions (per year) and interactive popups.
- PDF report generator that embeds feature importance visuals and explanatory summaries.
- Model comparison UI showing side-by-side scores for Random Forest, XGBoost and MLP models.
- Insights endpoint that returns model-level feature importance (used by dashboard and report generator).
- Notifications system in the frontend (context) to surface events: predictions, comparisons, and generated reports.
- Configurable top-N features shown in reports.
- Preprocessing pipeline that aligns raw features with the model's expected inputs, including consistent feature naming with underscores.

---

## Architecture

- **Backend**: FastAPI app serving model prediction endpoints, map endpoints, compare, report generation, and insights.
- **Models**: Random Forest / XGBoost / MLP model artifacts serialized (joblib).
- **Frontend**: React (Vite or CRA) with Tailwind CSS and small visualization components (Recharts, Leaflet, etc.).
- **Static files**: GeoJSON for subcounty polygons, stored plots and images produced during model training, and a `subcounty_reference.json` used by the map endpoint for yearly feature values.

---

## Backend

### API endpoints (high level)

You can access the backend here: https://gentrification-dashboard-production.up.railway.app/docs/

- `POST /predict?model_name=...` — predict a single-row input using a specific model. Body: `ModelInput` JSON (raw features). Returns `{ model, score, risk_category }`.
- `POST /compare` — compare multiple models on a single input. Body: `{ models: [..], features: {...} }`.
- `GET /map-predictions?subcounty=...&model=...&year=...` — return prediction for a subcounty and year using the stored `subcounty_reference.json` values.
- `POST /generate-report?model_name=...&subcounty=...&year=...&top_n=...` — generate a PDF report for a given input and return the file.
- `GET /insights` — returns model performance metrics and feature importance values (used to surface top risk factors in the dashboard).

> Note: Exact query parameter names and casing matter. The frontend expects `map-predictions` under `/api/` in some deployments — keep consistency between frontend API client and backend routes.

### Model pipelines

The backend stores full pipelines that include preprocessing (imputation, scaling, one-hot encoding) and a trained model. During prediction the expected raw features are required (these correspond to the `ModelInput` Pydantic model). **Raw feature names use underscores** (e.g. `pop_density`, `employment_rate`, `household_size`) — this alignment is crucial to avoid `KeyError` or missing column errors.

If your pipeline prints transformed feature names, you'll see prefixes like `num__...` and `cat__...` — these are safe: the pipeline will transform raw input to the expected encoded/normalized representation.

### Data files and reference JSONs

- `data/subcounty_reference.json` (or `_updated.json`): contains per-subcounty, per-year summary rows used for map predictions. Each year is a single object of raw features (not nested `features_mean`) in the final working version.
- `public/nairobi_subcounties.geojson`: polygon geometry used by the map component.
- `plots/`: saved feature importance images used in report generation.
- `insights.json`: model metrics and feature importance used by the dashboard (top-features logic).

---

## Frontend

You can access the frontend here: https://nairobi-gentrification-dashboard.vercel.app/

### Main pages & components (high level)

- `Predict` page — form that composes inputs to call `/predict`. Uses `ResultCard` to display result.
- `Compare` page — compare multiple models with shared inputs, shows bar chart.
- `Map` page — Map view component (`MapView.jsx`) that loads GeoJSON and enriches each feature by calling `/map-predictions` per feature (subcounty + year + model).
- `GenerateReport` component — small form (model, subcounty, year, number of top predictions) and call to `POST /generate-report` returning a PDF file for users to download.
- `Dashboard` — aggregate overview that calls `/map-predictions` for available subcounties & years to build metrics, and `/insights` for top risk feature lists.
- `Navbar` — shows user name and notifications; wired to a `NotificationContext` to allow components to add notifications when actions happen (prediction made, compare run, report generated).

### Interaction flows

- Prediction: user fills the cleaned raw features and selects model → `POST /predict` → show `score` (float) and `risk_category` (Low/Medium/High using project bucketing) → add notification.
- Compare: user selects models and fills features → `POST /compare` → show per-model scores → add notification.
- Map: user selects model and year → frontend loads GeoJSON and enriches each subcounty via `GET /map-predictions` → colors the map based on `risk_category` → clicking a subcounty shows popup with `score`, `sample_count`, and features used.
- Report: user clicks generate → `POST /generate-report` → backend creates PDF with plot images + explanatory text → frontend downloads file → add notification.

---

## Dataset & preprocessing

### Features (raw, cleaned names)

The model expects the following raw features (Pydantic `ModelInput` fields):
```
Rent, Food, Transport, Utilities, Misc,
pop_density, employment_rate, median_income, household_size,
dist_to_cbd_km, neighbors,
year, month, quarter,
Subcounty_clean
```

**Categorical features:** `Subcounty_clean` — only five supported values in the current deployment: `embakasi, kasarani, langata, makadara, westlands` (the code normalizes Embakasi subareas to `embakasi` to map multiple local names).

### Feature engineering and cleaning

- `Date` column is parsed into `year`, `month`, `quarter`.
- Subcounty names cleaned to lower-case and standardized (using StandardScaler) to a small set of values. There were no missing values in the dataset, hence no need for imputation.
- Features that previously included dots or spaces were renamed to use underscores: `pop. density` → `pop_density`, `employment rate` → `employment_rate`, `household size` → `household_size`.
- The `subcounty_reference.json` stores yearly aggregated values (a single row per subcounty-year) used for map predictions. The map endpoint reads values directly as raw features for prediction (no further aggregation required).

### Preprocessing pipeline

Implemented as a scikit-learn `ColumnTransformer` with two branches:

- `num` (numerical branch): `SimpleImputer(strategy='median')` → `StandardScaler()`
- `cat` (categorical branch): `SimpleImputer(strategy='most_frequent')` → `OneHotEncoder(handle_unknown='ignore')`

The pipeline receives *raw* feature columns; it performs imputation, scaling, and categorical one-hot encoding. The saved pipeline then feeds into trained estimators (RandomForest, XGBoost, MLP).

Common debug outputs to inspect:
- `raw_feature_names` (before transform): list of columns sent to pipeline.
- `transformed_feature_names` (after transform) — to inspect exact model inputs (e.g. `num__Rent`, `cat__Subcounty_clean_embakasi`, ...).

---

## Models & performance

### Model types included
- **Random Forest** (scikit-learn) — tree-based baseline with feature importance.
- **XGBoost** — gradient-boosted trees; usually strong on tabular data.
- **MLP** — simple feed-forward neural network (scikit-learn or Keras wrapper) — used as an alternate model class.

Model artifacts (joblib) are stored under `models/` and loaded at backend startup. Pipelines include preprocessing to avoid mismatch between training and serving.

### Performance Snapshot
| Model        | RMSE    | R²       |
|--------------|---------|----------|
| RandomForest | 0.2399  | 0.6807   |
| XGBoost      | 0.2446  | 0.7080   |
| MLP          | 0.2414  | 0.6551   |

> RMSE values are reported on the validation/test split used during model training. These numbers are illustrative; re-train or tune models to improve performance if needed.

> R^2 values reflect how well each model captures the patterns in the data compared to the mean. These numbers are also illustrative.

### How predictions are converted to risk buckets

The model output is a continuous score (can be negative). During analysis, a conversion to qualitative risk levels was defined using a symmetric threshold around zero (reflecting relative deviation). One working bucket function used in the app is:

```python
def pct_to_risk(value):
    if value < -0.05:
        return "Low"
    elif value < 0.05:
        return "Medium"
    return "High"
```
Use this function (or the equivalent thresholds in the backend) for consistent labeling between map, report and dashboard features. Ensure the same thresholds are applied across endpoints.

---

## Deployment & running locally

**Backend (FastAPI)**

1. Create virtualenv and install dependencies (example):
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Start the backend (development):
   ```bash
   uvicorn backend.app:app --reload --port 8000
   ```

3. Confirm endpoints are reachable:
   - `http://127.0.0.1:8000/docs` for OpenAPI docs.
   - `/predict`, `/compare`, `/map-predictions`, `/generate-report`, `/insights`

**Frontend (React)**

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start dev server:
   ```bash
   npm run dev   # or npm start for CRA
   ```

3. Update API base URL (if needed) in `src/api/client.js` to point to `http://localhost:8000` (or `/api` prefix if proxied).

**Files to check before running**:
- `data/subcounty_reference.json` (or `_updated.json`) must exist and contain expected raw feature names with underscores.
- `models/*.joblib` exist and were trained with same feature names and pipeline ordering.
- `plots/` contains `rf_fi.png`, `xgb_fi.png`, `mlp_fi.png` if you want the PDF report to embed images.

---

## How to contribute

- Keep feature names consistent between training and serving: prefer underscores for multi-word features.
- When adding a new subcounty mapping, update `SUBCOUNTY_PARENT` mapping and `AVAILABLE_SUBCOUNTIES` lists in backend and frontend.
- Add E2E tests for frontend interactions (Cypress or Playwright).

---

## Privacy & ethics

This project uses aggregated socio-economic and expenditure data. If you integrate real personal/household-level data, ensure you follow local data protection laws (e.g., Kenya DPA) and anonymize or aggregate personally-identifiable information. Avoid deploying sensitive or individual-level data without explicit consent and appropriate data governance.

---

## Appendix: Example payloads

### Predict (single model)
```json
POST /predict?model_name=Random%20Forest
Content-Type: application/json

{
  "Rent": 35000,
  "Food": 12000,
  "Transport": 60,
  "Utilities": 75,
  "Misc": 5000,
  "pop_density": 5200,
  "employment_rate": 78,
  "median_income": 48000,
  "household_size": 3,
  "dist_to_cbd_km": 11.5,
  "neighbors": 4,
  "year": 2024,
  "month": 11,
  "quarter": 4,
  "Subcounty_clean": "embakasi"
}
```

### Compare (multiple models)
```json
POST /compare
Content-Type: application/json

{
  "models": ["Random Forest", "XGBoost", "MLP"],
  "features": { ... same body as predict ... }
}
```

### Generate report (body + query params)
```
POST /generate-report?model_name=Random%20Forest&subcounty=embakasi&year=2023&top_n=5
Body: same ModelInput JSON as /predict
```

---

## Future Improvement
- Full historical trend charts
- Multilingual support
- Mobile-friendly dashboard mode
- Admin panel for model retraining
- Automated scheduled reports
- PostGIS integration

---
