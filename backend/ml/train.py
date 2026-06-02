import pandas as pd
import numpy as np
import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.base import BaseEstimator, TransformerMixin
from scipy.sparse import hstack, csr_matrix

SUSPICIOUS_KEYWORDS = [
    "registration fee", "urgent hiring", "guaranteed placement",
    "no interview", "pay first", "whatsapp only", "limited seats",
    "limited slots", "100% placement", "no experience needed",
    "work from home", "immediate joining", "no skills required",
    "guaranteed income", "earn from day 1", "security deposit",
    "training fee", "joining fee", "activation fee",
    "guaranteed returns", "no qualification", "work from mobile",
    "daily payment", "guaranteed payment", "buy back",
    "no degree needed", "copy paste", "form filling", "ad posting",
    "forwarding job", "whatsapp group",
    "work from home with high salary", "high salary",
    "crypto investment", "wire transfer", "upfront fee", "commission based only",
    "multi-level marketing", "pyramid", "mlm", "deposit money", 
    "onboarding fee", "platform fee", "training package", "software fee",
    "secret method", "get rich quick", "10x returns", "bitcoin"
]


class FeatureExtractor(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.tfidf = TfidfVectorizer(max_features=500, stop_words="english", ngram_range=(1, 2))

    def fit(self, X, y=None):
        self.tfidf.fit(X)
        return self

    def transform(self, X):
        tfidf_matrix = self.tfidf.transform(X)
        keyword_features = []
        length_features = []
        for text in X:
            lower = text.lower()
            kw_flags = [1 if kw in lower else 0 for kw in SUSPICIOUS_KEYWORDS]
            keyword_features.append(kw_flags)
            length_features.append([len(text), lower.count("!"), lower.count("rs "), sum(kw_flags)])
        keyword_matrix = csr_matrix(np.array(keyword_features))
        length_matrix = csr_matrix(np.array(length_features))
        return hstack([tfidf_matrix, keyword_matrix, length_matrix])


def train():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    df = pd.read_csv(os.path.join(base_dir, "dataset.csv"))
    X = df["text"].values
    y = (df["label"] == "scam").astype(int).values

    extractor = FeatureExtractor()
    model = RandomForestClassifier(n_estimators=100, random_state=42)

    extractor.fit(X, y)
    X_transformed = extractor.transform(X)
    model.fit(X_transformed, y)

    scores = cross_val_score(model, X_transformed, y, cv=5, scoring="accuracy")
    print(f"Cross-validation accuracy: {scores.mean():.2f} (+/- {scores.std():.2f})")

    model_dir = os.path.dirname(os.path.abspath(__file__))
    joblib.dump(extractor, os.path.join(model_dir, "extractor.pkl"))
    joblib.dump(model, os.path.join(model_dir, "model.pkl"))
    print("Model and extractor saved.")


if __name__ == "__main__":
    train()
