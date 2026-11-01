"""
Statistical Baseline Anomaly Detector: Mahalanobis Distance / Hotelling's T^2
Fitted strictly on normal training data.
"""

from typing import Dict, Any
import numpy as np
import pandas as pd


class StatisticalDistanceBaseline:
    """
    Multivariate Statistical Baseline Detector using Mahalanobis Distance.
    
    Assumptions:
    1. Healthy operating states follow a multivariate distribution with stable mean and covariance.
    2. Anomalies deviate significantly from the correlated sensor envelope.
    
    Threshold Selection:
    Calibrated strictly on training/validation normal data using an empirical percentile
    corresponding to a target nominal false-alarm rate (e.g., 99th percentile => alpha = 0.01).
    """

    def __init__(self, alpha: float = 0.01, regularize: float = 1e-6):
        self.alpha = alpha
        self.regularize = regularize
        self.mean_: np.ndarray | None = None
        self.cov_inv_: np.ndarray | None = None
        self.threshold_: float | None = None
        self.feature_names_: list[str] = []

    def fit(self, X: pd.DataFrame | np.ndarray) -> "StatisticalDistanceBaseline":
        if isinstance(X, pd.DataFrame):
            self.feature_names_ = list(X.columns)
            X_mat = X.to_numpy()
        else:
            X_mat = np.asarray(X)

        self.mean_ = np.mean(X_mat, axis=0)
        cov = np.cov(X_mat, rowvar=False)

        # Regularize covariance matrix to guarantee invertibility
        cov_reg = cov + np.eye(cov.shape[0]) * self.regularize
        self.cov_inv_ = np.linalg.pinv(cov_reg)

        # Compute training distances and determine threshold strictly on training data
        train_distances = self.score_samples(X_mat)
        self.threshold_ = float(np.percentile(train_distances, 100.0 * (1.0 - self.alpha)))
        return self

    def score_samples(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        if isinstance(X, pd.DataFrame):
            X_mat = X.to_numpy()
        else:
            X_mat = np.asarray(X)

        diff = X_mat - self.mean_
        # Mahalanobis distance squared: (x - mu)^T * Sigma^{-1} * (x - mu)
        dist_sq = np.sum((diff @ self.cov_inv_) * diff, axis=1)
        # Avoid tiny negative floats due to numerical precision
        dist_sq = np.maximum(dist_sq, 0.0)
        return np.sqrt(dist_sq)

    def predict(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        """
        Returns binary predictions:
            0 = Normal (Inlier)
            1 = Anomaly (Outlier)
        """
        if self.threshold_ is None:
            raise ValueError("Baseline model must be fitted before predict()")
        scores = self.score_samples(X)
        return (scores > self.threshold_).astype(int)

    def get_params(self) -> Dict[str, Any]:
        return {
            "name": "MahalanobisDistanceBaseline",
            "alpha": self.alpha,
            "threshold": self.threshold_,
            "feature_names": self.feature_names_,
        }
