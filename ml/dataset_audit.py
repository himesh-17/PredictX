"""
Dataset Audit Module for SKAB (Skoltech Anomaly Benchmark)
Motor Predictive Maintenance Project - Stage 1 Audit
"""

from collections import defaultdict
from pathlib import Path
import numpy as np
import pandas as pd

SELECTED_FEATURES = [
    "Accelerometer1RMS",
    "Accelerometer2RMS",
    "Current",
    "Temperature",
    "Thermocouple",
    "Voltage",
]

EXCLUDED_PROCESS_FEATURES = [
    "Pressure",
    "Volume Flow RateRMS",
]


def audit_dataset(data_dir: Path, output_csv: Path | None = None) -> pd.DataFrame:
    """
    Audits all CSV files in the SKAB dataset directory.
    Checks file properties, schemas, missing values, timestamps, and label semantics.
    """
    audit_records = []
    schema_groups = defaultdict(list)

    if not data_dir.exists():
        raise FileNotFoundError(f"Data directory not found: {data_dir}")

    folders = sorted([f for f in data_dir.iterdir() if f.is_dir()])
    print(f"Found {len(folders)} folders in {data_dir}")

    for folder in folders:
        csv_files = sorted(folder.glob("*.csv"))
        for file_path in csv_files:
            df = pd.read_csv(file_path, sep=";")
            n_rows, n_cols = df.shape
            cols = tuple(df.columns.tolist())
            schema_groups[cols].append(f"{folder.name}/{file_path.name}")

            null_count = int(df.isnull().sum().sum())
            dup_rows = int(df.duplicated().sum())

            # Timestamp checks
            if "datetime" in df.columns:
                df["datetime"] = pd.to_datetime(df["datetime"])
                dt_min = str(df["datetime"].min())
                dt_max = str(df["datetime"].max())
                dup_timestamps = int(df["datetime"].duplicated().sum())

                time_deltas = df["datetime"].diff().dt.total_seconds().dropna()
                dt_median = float(time_deltas.median()) if len(time_deltas) > 0 else None
                dt_max_gap = float(time_deltas.max()) if len(time_deltas) > 0 else None
                dt_min_gap = float(time_deltas.min()) if len(time_deltas) > 0 else None
                dt_irregular_pct = (
                    float((time_deltas != 1.0).sum() / len(time_deltas) * 100)
                    if len(time_deltas) > 0
                    else 0.0
                )
            else:
                dt_min, dt_max = None, None
                dup_timestamps = 0
                dt_median, dt_max_gap, dt_min_gap, dt_irregular_pct = None, None, None, None

            # Label columns
            has_anomaly = "anomaly" in df.columns
            has_changepoint = "changepoint" in df.columns

            anomaly_count = int((df["anomaly"] == 1.0).sum()) if has_anomaly else 0
            anomaly_ratio = float((df["anomaly"] == 1.0).mean() * 100) if has_anomaly else 0.0
            cp_count = int((df["changepoint"] == 1.0).sum()) if has_changepoint else 0

            # Feature validity check
            features_present = all(feat in df.columns for feat in SELECTED_FEATURES)
            all_numeric = True
            if features_present:
                for feat in SELECTED_FEATURES:
                    if not pd.api.types.is_numeric_dtype(df[feat]):
                        all_numeric = False
                        break

            audit_records.append(
                {
                    "folder": folder.name,
                    "filename": file_path.name,
                    "rows": n_rows,
                    "cols": n_cols,
                    "features_valid": features_present and all_numeric,
                    "nulls": null_count,
                    "dup_rows": dup_rows,
                    "dup_timestamps": dup_timestamps,
                    "dt_median_sec": dt_median,
                    "dt_min_gap_sec": dt_min_gap,
                    "dt_max_gap_sec": dt_max_gap,
                    "dt_irregular_pct": round(dt_irregular_pct, 2) if dt_irregular_pct is not None else None,
                    "has_anomaly": has_anomaly,
                    "anomaly_rows": anomaly_count,
                    "anomaly_ratio_pct": round(anomaly_ratio, 2),
                    "changepoints": cp_count,
                    "start_time": dt_min,
                    "end_time": dt_max,
                }
            )

    audit_df = pd.DataFrame(audit_records)

    if output_csv is not None:
        output_csv.parent.mkdir(parents=True, exist_ok=True)
        audit_df.to_csv(output_csv, index=False)
        print(f"Saved audit summary to: {output_csv}")

    return audit_df


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent
    raw_dir = base_dir / "data" / "raw" / "SKAB"
    out_csv = base_dir / "data" / "processed" / "skab_dataset_audit.csv"

    print("Running Dataset Audit...")
    df_audit = audit_dataset(raw_dir, out_csv)

    print("\n" + "=" * 60)
    print("AUDIT SUMMARY BY FOLDER:")
    print("=" * 60)
    summary = df_audit.groupby("folder").agg(
        files=("filename", "count"),
        total_rows=("rows", "sum"),
        min_rows=("rows", "min"),
        max_rows=("rows", "max"),
        has_anomaly_col=("has_anomaly", "all"),
        total_nulls=("nulls", "sum"),
        total_dup_rows=("dup_rows", "sum"),
        total_dup_ts=("dup_timestamps", "sum"),
        mean_anomaly_pct=("anomaly_ratio_pct", "mean"),
        total_changepoints=("changepoints", "sum"),
    )
    print(summary.to_string())
    print("\nDataset audit completed successfully.")
