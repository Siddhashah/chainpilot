"""
Theta method forecaster — replaces SARIMA from the original lineup.

Chosen deliberately: the Theta method won the M3 forecasting competition
and is widely regarded as a strong, simple, low-tuning general-purpose
forecaster — a better fit here than SARIMA, which needs more careful
tuning and is more failure-prone on short/noisy series. It's built into
statsmodels, so this adds no new dependency.
"""

import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings("ignore")

from models.base_model import BaseForecaster


class ThetaForecaster(BaseForecaster):
    name = "theta"

    def __init__(self):
        self._model_fit = None

    def fit(self, df: pd.DataFrame) -> "ThetaForecaster":
        from statsmodels.tsa.forecasting.theta import ThetaModel

        series = df.set_index("date")["quantity"].asfreq("D").ffill()
        use_seasonal = len(series) >= 14

        try:
            model = ThetaModel(series, period=7 if use_seasonal else 2, deseasonalize=use_seasonal)
            self._model_fit = model.fit()
        except Exception:
            model = ThetaModel(series, deseasonalize=False)
            self._model_fit = model.fit()
        return self

    def predict(self, steps: int) -> pd.DataFrame:
        forecast = self._model_fit.forecast(steps)
        intervals = self._model_fit.prediction_intervals(steps, alpha=0.2)

        return pd.DataFrame({
            "date":             forecast.index,
            "predicted_usage":  np.maximum(0, forecast.values),
            "lower_bound":      np.maximum(0, intervals["lower"].values),
            "upper_bound":      np.maximum(0, intervals["upper"].values),
        })
