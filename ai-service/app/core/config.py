import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

# Robust model directory resolution (Root repo, local folder, or env override)
env_model_dir = os.getenv("MODEL_DIR")
if env_model_dir and Path(env_model_dir).exists():
    MODEL_DIR = Path(env_model_dir)
elif (BASE_DIR / "ml" / "saved_models").exists():
    MODEL_DIR = BASE_DIR / "ml" / "saved_models"
elif (Path(__file__).resolve().parent.parent.parent / "ml" / "saved_models").exists():
    MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "ml" / "saved_models"
else:
    MODEL_DIR = BASE_DIR / "ml" / "saved_models"
MODEL_PATH = MODEL_DIR / "isolation_forest_pipeline.joblib"
METADATA_PATH = MODEL_DIR / "model_metadata.json"

SERVICE_NAME = "Predict-X-AI-Service"
SERVICE_VERSION = "1.0.0"
HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))
