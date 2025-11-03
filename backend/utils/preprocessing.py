import pandas as pd
import numpy as np
from pyparsing import col

def auto_preprocess_input(df: pd.DataFrame):
    """Automatically preprocess input DataFrame to numeric features expected by 
    models.
    - Converts date-like strings to year/month
    - Drops non-convertible text
    - Keeps numeric columns
    - Returns processed DataFrame
    """
    X = df.copy()
    for col in list(X.columns):
    # if already datetime dtype
        if np.issubdtype(X[col].dtype, np.datetime64):
            X[f"{col}_year"] = X[col].dt.year
            X[f"{col}_month"] = X[col].dt.month
            X.drop(columns=[col], inplace=True)
        elif X[col].dtype == object:
            # try parse as datetime
            try:
                X[col] = pd.to_datetime(X[col])
                X[f"{col}_year"] = X[col].dt.year
                X[f"{col}_month"] = X[col].dt.month
                X.drop(columns=[col], inplace=True)
            except Exception:
                # drop text column
                X.drop(columns=[   col], inplace=True)

    # keep numbers only
    X = X.select_dtypes(include=[np.number])
    return X