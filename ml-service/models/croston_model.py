"""
Croston's method (with Syntetos-Boylan Approximation bias correction) —
newly added, not part of the original lineup.

Purpose-built for *intermittent* demand: series with many zero-usage
days interrupted by occasional bursts, which is common for slower-moving
materials in a real supply chain. Generic time-series models (Holt-
Winters, Theta) fit poorly here because zeros disrupt trend/seasonality
estimation. Croston's separates the series into demand *sizes* and the
*intervals* between them, smooths each independently, and forecasts a
constant rate. SBA correction removes Croston's well-documented small
positive bias. Pure numpy/pandas — no new dependency.
"""

import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings("ignore")

from models.base_model import BaseForecaster


class CrostonForecaster(BaseForecaster):
    name = "croston"

    def __init__(self, alpha: float = 0.1):
        self._alpha = alpha
        self._rate = 0.0
        self._std = 0.1

    def fit(self, df: pd.DataFrame) -> "CrostonForecaster":
        series = df.sort_values("date")["quantity"].values.astype(float)

        demands, intervals = [], []
        last_demand_idx = None
        for i, q in enumerate(series):
            if q > 0:
                demands.append(q)
                intervals.append(i + 1 if last_demand_idx is None else i - last_demand_idx)
                last_demand_idx = i

        if not demands:
            self._rate, self._std = 0.0, 0.1
            return self

        z, p = demands[0], (intervals[0] if intervals else 1)
        for d, iv in zip(demands[1:], intervals[1:]):
            z = self._alpha * d + (1 - self._alpha) * z
            p = self._alpha * iv + (1 - self._alpha) * p

        sba_factor = 1 - (self._alpha / 2)
        self._rate = (z / p) * sba_factor if p > 0 else 0.0
        self._std = float(np.std(demands)) / max(p, 1) if len(demands) > 1 else self._rate * 0.3
        return self

    def predict(self, steps: int) -> pd.DataFrame:
        preds = np.full(steps, max(0.0, self._rate))
        last_date = pd.Timestamp.today().normalize()
        dates = [last_date + pd.Timedelta(days=i + 1) for i in range(steps)]

        return pd.DataFrame({
            "date":            dates,
            "predicted_usage": preds,
            "lower_bound":     np.maximum(0, preds - 1.28 * self._std),
            "upper_bound":     preds + 1.28 * self._std,
        })
