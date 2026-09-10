"""
Naive baseline forecaster (moving-average with drift).

The guaranteed fallback: always available, always succeeds. Averages the
most recent window of observations for the level, and extrapolates the
trend across that window for the drift component. This is a standard,
well-known baseline technique (related to Holt's "naive with drift"),
deliberately simple rather than a dressed-up regression model, precisely
because a baseline's job is to be a trustworthy floor other models must
beat.
"""

import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings("ignore")

from models.base_model import BaseForecaster


class NaiveForecaster(BaseForecaster):
    name = "naive_baseline"

    def __init__(self, window: int = 14):
        self._window = window
        self._level = 0.0
        self._drift = 0.0
        self._std = 0.1

    def fit(self, df: pd.DataFrame) -> "NaiveForecaster":
        series = df.sort_values("date")["quantity"].values.astype(float)
        w = min(self._window, len(series))
        recent = series[-w:] if w > 0 else np.array([0.0])

        self._level = float(recent.mean())
        self._drift = float((recent[-1] - recent[0]) / (w - 1)) if w >= 2 else 0.0
        self._std = float(series.std()) if len(series) > 1 else max(self._level * 0.15, 0.1)
        return self

    def predict(self, steps: int) -> pd.DataFrame:
        preds = np.array([max(0.0, self._level + self._drift * (i + 1)) for i in range(steps)])
        last_date = pd.Timestamp.today().normalize()
        dates = [last_date + pd.Timedelta(days=i + 1) for i in range(steps)]

        return pd.DataFrame({
            "date":            dates,
            "predicted_usage": preds,
            "lower_bound":     np.maximum(0, preds - 1.28 * self._std),
            "upper_bound":     preds + 1.28 * self._std,
        })
