CREATE TABLE IF NOT EXISTS job_posts (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scam_reports (
    id SERIAL PRIMARY KEY,
    job_post_id INTEGER REFERENCES job_posts(id),
    reporter_reason TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    job_text TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    label VARCHAR(10) NOT NULL,
    confidence FLOAT NOT NULL,
    matched_keywords TEXT[],
    scam_probability FLOAT,
    safe_probability FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_feedback (
    id SERIAL PRIMARY KEY,
    prediction_id INTEGER REFERENCES predictions(id),
    is_accurate BOOLEAN NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
