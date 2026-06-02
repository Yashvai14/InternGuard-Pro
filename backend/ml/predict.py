import joblib
import os
import numpy as np
import requests
import json
from .train import SUSPICIOUS_KEYWORDS, train, FeatureExtractor
import sys

# Workaround for joblib unpickling a class saved as __main__.FeatureExtractor
if not hasattr(sys.modules['__main__'], 'FeatureExtractor'):
    setattr(sys.modules['__main__'], 'FeatureExtractor', FeatureExtractor)

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

    # Default ML values
    risk_score = int(round(scam_prob * 100))
    label = "scam" if scam_prob >= 0.5 else "safe"
    confidence = round(max(scam_prob, safe_prob), 2)
    keywords = find_suspicious_keywords(text)
    
    explanation = "No explanation available."
    ollama_flags = []

    # Try Ollama integration
    try:
        prompt = f"""You are an expert fraud detection AI. Analyze the following job description for scam/fraud indicators. 
Respond ONLY with a valid JSON object matching this schema, no markdown blocks, no other text:
{{
  "scam_probability": <float between 0.0 and 1.0>,
  "explanation": "<2-3 clear sentences explaining why it is safe or a scam>",
  "suggestions": "<1-2 sentences on what the user should do next (e.g., safe alternatives, verification steps)>",
  "red_flags": ["<flag1>", "<flag2>"]
}}

Job Description:
{text}
"""
        resp = requests.post("http://localhost:11434/api/generate", json={
            "model": "llama3",
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }, timeout=120)
        
        if resp.status_code == 200:
            data = resp.json()
            response_text = data.get("response", "{}")
            ollama_result = json.loads(response_text)
            
            ollama_scam_prob = float(ollama_result.get("scam_probability", scam_prob))
            
            base_explanation = ollama_result.get("explanation", explanation)
            suggestions = ollama_result.get("suggestions", "")
            if suggestions:
                explanation = f"{base_explanation}\n\nSuggestions: {suggestions}"
            else:
                explanation = base_explanation
                
            ollama_flags = ollama_result.get("red_flags", [])
            
            # Blend ML model probability with Ollama probability (50/50 weight)
            blended_scam_prob = (scam_prob + ollama_scam_prob) / 2.0
            blended_safe_prob = 1.0 - blended_scam_prob
            
            risk_score = int(round(blended_scam_prob * 100))
            label = "scam" if blended_scam_prob >= 0.5 else "safe"
            confidence = round(max(blended_scam_prob, blended_safe_prob), 2)
            
            # Update probs to blended
            scam_prob = blended_scam_prob
            safe_prob = blended_safe_prob
            
            # Merge keywords
            for flag in ollama_flags:
                if flag not in keywords:
                    keywords.append(flag)
    except Exception as e:
        print(f"Ollama integration failed: {e}")

    return {
        "risk_score": risk_score,
        "label": label,
        "confidence": confidence,
        "keywords": keywords,
        "scam_probability": round(scam_prob, 4),
        "safe_probability": round(safe_prob, 4),
        "explanation": explanation,
        "ollama_flags": ollama_flags
    }
