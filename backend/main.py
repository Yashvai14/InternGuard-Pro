import os
import traceback
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

from database import Prediction, UserFeedback, init_db, get_session
from ml.predict import predict, load_model

REQUIRED_ENV = ["DATABASE_URL"]


def validate_env():
    missing = [v for v in REQUIRED_ENV if not os.getenv(v)]
    if missing:
        print(f"Warning: missing env vars {missing}, using defaults")


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_env()
    load_model()
    try:
        await init_db()
        app.state.db_available = True
        print("Database connected successfully.")
    except Exception as e:
        app.state.db_available = False
        print(f"Database unavailable, running without persistence: {e}")
    yield


app = FastAPI(title="InternGuard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    text: str


class FeedbackRequest(BaseModel):
    prediction_id: int
    is_accurate: bool
    comment: str | None = None


@app.post("/predict")
async def predict_endpoint(req: PredictRequest, request: Request):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        result = predict(req.text)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    prediction_id = 0
    if request.app.state.db_available:
        try:
            async for session in get_session():
                prediction = Prediction(
                    job_text=req.text,
                    risk_score=result["risk_score"],
                    label=result["label"],
                    confidence=result["confidence"],
                    matched_keywords=result["keywords"],
                    scam_probability=result["scam_probability"],
                    safe_probability=result["safe_probability"],
                )
                session.add(prediction)
                await session.commit()
                await session.refresh(prediction)
                prediction_id = prediction.id
        except Exception as e:
            print(f"DB write skipped: {e}")

    return {
        "prediction_id": prediction_id,
        **result,
    }


@app.post("/feedback")
async def feedback_endpoint(req: FeedbackRequest, request: Request):
    if not request.app.state.db_available:
        return {"status": "ok", "note": "database offline, feedback not saved"}
    try:
        async for session in get_session():
            feedback = UserFeedback(
                prediction_id=req.prediction_id,
                is_accurate=req.is_accurate,
                comment=req.comment,
            )
            session.add(feedback)
            await session.commit()
            return {"status": "ok"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Feedback save failed: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "healthy"}
