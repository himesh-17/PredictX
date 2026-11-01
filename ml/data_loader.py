"""
Data Loading and Splitting Module for SKAB Anomaly Detection
Implements strictly leak-free chronological splitting and experiment isolation.
"""

from pathlib import Path
from typing import Dict, List, Tuple
import pandas as pd

SELECTED_FEATURES: List[str] = [
    "Accelerometer1RMS",
    "Accelerometer2RMS",
    "Current",
    "Temperature",
    "Thermocouple",
    "Voltage",
]


def load_normal_data(
    file_path: Path,
    train_ratio: float = 0.8,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Loads anomaly-free.csv and applies a strict CHRONOLOGICAL split.
    
    Returns:
        df_train: First train_ratio fraction (normal training observations)
        df_val: Remaining (1 - train_ratio) fraction (normal validation observations for FPR check)
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Normal file not found: {file_path}")

    df = pd.read_csv(file_path, sep=";")
    df["datetime"] = pd.to_datetime(df["datetime"])
    df = df.sort_values("datetime").reset_index(drop=True)

    n_total = len(df)
    n_train = int(n_total * train_ratio)

    df_train = df.iloc[:n_train].copy().reset_index(drop=True)
    df_val = df.iloc[n_train:].copy().reset_index(drop=True)

    # Assign ground truth anomaly labels (all 0.0 for normal recording)
    df_train["anomaly"] = 0.0
    df_val["anomaly"] = 0.0

    return df_train, df_val


def load_test_recording(file_path: Path) -> pd.DataFrame:
    """
    Loads a single labelled experiment recording from valve1, valve2, or other.
    Validates column existence and chronological order.
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Test file not found: {file_path}")

    df = pd.read_csv(file_path, sep=";")
    df["datetime"] = pd.to_datetime(df["datetime"])
    df = df.sort_values("datetime").reset_index(drop=True)

    # Ensure required features and labels exist
    for col in SELECTED_FEATURES:
        if col not in df.columns:
            raise ValueError(f"Missing feature '{col}' in {file_path.name}")

    if "anomaly" not in df.columns:
        raise ValueError(f"Missing ground truth label 'anomaly' in {file_path.name}")

    return df


def load_benchmark_test_recordings(
    skab_dir: Path,
    folders: List[str] = ["valve1", "valve2", "other"],
    sample_per_folder: int | None = None,
) -> Dict[str, pd.DataFrame]:
    """
    Loads all or a representative subset of labelled test recordings.
    Returns a dictionary mapping 'folder/filename' -> DataFrame.
    """
    test_datasets = {}
    for folder in folders:
        fpath = skab_dir / folder
        files = sorted(fpath.glob("*.csv"))
        if sample_per_folder is not None:
            files = files[:sample_per_folder]
        for f in files:
            key = f"{folder}/{f.name}"
            test_datasets[key] = load_test_recording(f)
    return test_datasets
