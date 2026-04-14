# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import predict_disease, predict_count, predict_quality, predict_behavior

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

@app.get("/health")
def health(): return { "status": "ok" }
