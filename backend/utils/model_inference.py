import pandas as pd
import numpy as np
from sklearn.exceptions import NotFittedError
from .preprocessing import auto_preprocess_input




def align_features(X: pd.DataFrame, expected_cols):
# add any missing cols as zeros and reorder
    for col in expected_cols:
        if col not in X.columns:
            X[col] = 0
    X = X[expected_cols]
    return X




def predict_gentrification(model, input_df: pd.DataFrame):
    # preprocess
    X = auto_preprocess_input(input_df)


    # align with model
    if hasattr(model, "feature_names_in_"):
        expected = list(model.feature_names_in_)
        X = align_features(X, expected)
    else:
    # fallback: use numeric columns as-is
        X = X.select_dtypes(include=[np.number])


    # ensure correct shape
    if X.shape[0] == 0:
        raise ValueError("No numeric features after preprocessing. Check inputs.")


    try:
        preds = model.predict_proba(X)[:, 1]
        return preds
    except NotFittedError:
        raise ValueError("Model is not fitted. Retrain and save a fitted model.")
    except AttributeError:
    # maybe model doesn't have predict_proba (e.g. some wrappers)
        preds = model.predict(X)
        return preds