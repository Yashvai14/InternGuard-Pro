import joblib
import os
import numpy as np
from .train import SUSPICIOUS_KEYWORDS, train

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
_extractor = None
_model = None


def load_model():
    global _extractor, _model
    extractor_path = os.path.join(MODEL_DIR, "extractor.pkl")
    model_path = os.path.join(MODEL_DIR, "model.pkl")
    if not os.path.exists(extractor_path) or not os.path.exists(model_path):
        print("Model files not found. Training model automatically...")
        train()
    _extractor = joblib.load(extractor_path)
    _model = joblib.load(model_path)
    print("Model loaded successfully.")


def get_model():
    if _extractor is None or _model is None:
        load_model()
    return _extractor, _model


def find_suspicious_keywords(text: str) -> list[str]:
    lower = text.lower()
    return [kw for kw in SUSPICIOUS_KEYWORDS if kw in lower]


def predict(text: str) -> dict:
    extractor, model = get_model()
    X = extractor.transform([text])
    proba = model.predict_proba(X)[0]
    scam_prob = float(proba[1])
    safe_prob = float(proba[0])

    risk_score = int(round(scam_prob * 100))
    label = "scam" if scam_prob >= 0.5 else "safe"
    confidence = round(max(scam_prob, safe_prob), 2)
    keywords = find_suspicious_keywords(text)

    return {
        "risk_score": risk_score,
        "label": label,
        "confidence": confidence,
        "keywords": keywords,
        "scam_probability": round(scam_prob, 4),
        "safe_probability": round(safe_prob, 4),
    }
