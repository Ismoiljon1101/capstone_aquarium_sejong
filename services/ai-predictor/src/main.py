from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import predict_disease, predict_count, predict_quality, predict_behavior, capture_camera
from src.routes.predict_attitude import router as attitude_router
from src.routes.predict_movement import router as movement_router

try:
    import torch
    _device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[AI Predictor] Running on device: {_device}")
except ImportError:
    print("[AI Predictor] torch not available — running in CPU-only mode")

app = FastAPI(title="Fishlinic AI Predictor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3002", "http://localhost:8081"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_disease.router)
app.include_router(predict_count.router)
app.include_router(predict_quality.router)
app.include_router(predict_behavior.router)
app.include_router(capture_camera.router)
app.include_router(attitude_router)
app.include_router(movement_router)

@app.get("/health")
def health(): return { "status": "ok" }
