import sys
from pathlib import Path

# Add 'ai-service' and repository root to sys.path so 'app.*' imports resolve anywhere
CURRENT_FILE = Path(__file__).resolve()
AI_SERVICE_DIR = CURRENT_FILE.parent.parent  # .../ai-service
REPO_ROOT = AI_SERVICE_DIR.parent            # .../ (workspace root)

for path_dir in (str(AI_SERVICE_DIR), str(REPO_ROOT)):
    if path_dir not in sys.path:
        sys.path.insert(0, path_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router
from app.core.config import SERVICE_NAME, SERVICE_VERSION

app = FastAPI(
    title=SERVICE_NAME,
    version=SERVICE_VERSION,
    description="FastAPI Machine Learning Inference Service for Motor Predictive Maintenance",
)

# Enable CORS for backend and frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "docsUrl": "/docs",
        "healthUrl": "/api/v1/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
