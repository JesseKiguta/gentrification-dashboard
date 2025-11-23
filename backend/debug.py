import joblib
from pprint import pprint

model = joblib.load("models/RandomForest_model.joblib")

# raw column names
print("Raw feature names:")
try:
    pprint(model.named_steps["preprocess"].feature_names_in_)
except Exception as e:
    print("Cannot get raw feature names:", e)

# final columns after ColumnTransformer
print("\nTransformed feature names (what the model receives):")
try:
    pprint(model.named_steps["preprocess"].get_feature_names_out())
except Exception as e:
    print("Cannot get transformed feature names:", e)
