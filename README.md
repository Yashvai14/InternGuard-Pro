# InternGuard Pro

AI-powered Fake Internship & Job Post Detection System built for students. Paste any job or internship description and get an instant scam risk analysis with a confidence score, risk rating, and flagged suspicious keywords.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + Tailwind CSS v4
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL
- **ML Model:** TF-IDF + Logistic Regression (scikit-learn)

## Project Structure

```
internguard-pro/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── analyze/
│   │   └── page.tsx              # Job description input page
│   ├── result/
│   │   └── page.tsx              # Analysis result display page
│   └── api/
│       ├── analyze/route.ts      # API proxy → FastAPI /predict
│       └── feedback/route.ts     # API proxy → FastAPI /feedback
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── Problem.tsx
│   ├── HowItWorks.tsx
│   ├── Features.tsx
│   ├── Trust.tsx
│   └── Footer.tsx
├── backend/
│   ├── main.py                   # FastAPI app (endpoints)
│   ├── database.py               # SQLAlchemy async models
│   ├── schema.sql                # PostgreSQL table definitions
│   ├── dataset.csv               # 40 labeled training samples
│   ├── requirements.txt          # Python dependencies
│   └── ml/
│       ├── __init__.py
│       ├── train.py              # Model training script
│       └── predict.py            # Prediction logic
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Prerequisites

Make sure the following are installed on your system:

- **Node.js** (v18 or higher) — [Download](https://nodejs.org/)
- **Python** (v3.10 or higher) — [Download](https://www.python.org/downloads/)
- **PostgreSQL** (v14 or higher) — [Download](https://www.postgresql.org/download/)
- **pip** (comes with Python)
- **npm** (comes with Node.js)

## Setup Instructions

### Step 1: Clone the Repository

```powershell
git clone <your-repo-url>
cd internguard-pro
```

### Step 2: Set Up PostgreSQL Database

Open a terminal and run:

```powershell
psql -U postgres -c "CREATE DATABASE internguard;"
psql -U postgres -d internguard -f backend/schema.sql
```

This creates the `internguard` database and the following tables:
- `job_posts` — stores raw job post text
- `scam_reports` — stores user-submitted scam reports
- `predictions` — stores every ML prediction result
- `user_feedback` — stores user feedback on prediction accuracy

> If your PostgreSQL uses a different username/password, update the `DATABASE_URL` environment variable (see Environment Variables below).

### Step 3: Set Up the Backend (FastAPI + ML)

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

#### Train the ML Model

```powershell
python -m ml.train
```

This reads `dataset.csv`, trains a TF-IDF + Logistic Regression model, and saves `model.pkl` and `extractor.pkl` inside `backend/ml/`.

Expected output:
```
Cross-validation accuracy: 0.95 (+/- 0.05)
Model and extractor saved.
```

#### Start the Backend Server

```powershell
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

Verify it's running:
```powershell
curl http://localhost:8000/health
```

Expected response: `{"status":"healthy"}`

### Step 4: Set Up the Frontend (Next.js)

Open a **new terminal** and navigate to the project root:

```powershell
cd internguard-pro
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/internguard` | PostgreSQL connection string (set in backend) |
| `BACKEND_URL` | `http://localhost:8000` | FastAPI backend URL (set in frontend `.env.local`) |

To override, create a `.env.local` file in the project root for Next.js:

```
BACKEND_URL=http://localhost:8000
```

Or set the database URL as a system environment variable before starting the backend:

```powershell
$env:DATABASE_URL = "postgresql+asyncpg://youruser:yourpass@localhost:5432/internguard"
```

## How to Use

1. Open `http://localhost:3000` in your browser
2. Click **"Check a Job Post"** on the homepage (or navigate to `/analyze`)
3. Paste the full job/internship description into the text area
4. Click **"Check This Post"**
5. View the results on the `/result` page:
   - **Risk Score** (0–100) with color-coded severity
   - **Scam / Safe** verdict label
   - **Confidence %** of the prediction
   - **Suspicious keywords** highlighted as red tags
   - **Probability breakdown** (scam % vs safe %)
6. Submit feedback on whether the analysis was accurate or not

## API Endpoints

### `POST /predict`

Analyze a job post for scam indicators.

**Request:**
```json
{
  "text": "Urgent hiring! Pay Rs 500 registration fee. No interview needed. WhatsApp only."
}
```

**Response:**
```json
{
  "prediction_id": 1,
  "risk_score": 92,
  "label": "scam",
  "confidence": 92.3,
  "matched_keywords": ["registration fee", "no interview", "whatsapp only", "urgent hiring"],
  "scam_probability": 92.3,
  "safe_probability": 7.7
}
```

### `POST /feedback`

Submit user feedback on a prediction.

**Request:**
```json
{
  "prediction_id": 1,
  "is_accurate": true,
  "comment": "This was definitely a scam"
}
```

**Response:**
```json
{
  "status": "ok"
}
```

### `GET /health`

Health check endpoint. Returns `{"status": "healthy"}`.

## Database Schema

### `job_posts`
- `id` — Primary key
- `text` — Job post content
- `source` — Where the post was found
- `created_at` — Timestamp

### `scam_reports`
- `id` — Primary key
- `job_post_id` — Foreign key to `job_posts`
- `reporter_reason` — Why it was reported
- `reported_at` — Timestamp

### `predictions`
- `id` — Primary key
- `job_text` — Analyzed text
- `risk_score` — 0 to 100
- `label` — "scam" or "safe"
- `confidence` — Prediction confidence %
- `matched_keywords` — Array of flagged keywords
- `scam_probability` / `safe_probability` — Raw probabilities
- `created_at` — Timestamp

### `user_feedback`
- `id` — Primary key
- `prediction_id` — Foreign key to `predictions`
- `is_accurate` — Boolean
- `comment` — Optional user comment
- `created_at` — Timestamp

## ML Model Details

- **Algorithm:** Logistic Regression
- **Features:**
  - TF-IDF vectors (unigrams + bigrams, max 500 features)
  - 30 binary keyword flags (e.g., "registration fee", "guaranteed placement", "whatsapp only")
  - Text length, exclamation count, rupee mention count, total keyword match count
- **Training data:** 40 manually labeled job posts (20 scam, 20 safe)
- **Saved artifacts:** `backend/ml/model.pkl`, `backend/ml/extractor.pkl`

## Quick Start Summary

```powershell
# Terminal 1 — Database
psql -U postgres -c "CREATE DATABASE internguard;"
psql -U postgres -d internguard -f backend/schema.sql

# Terminal 2 — Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m ml.train
uvicorn main:app --reload --port 8000

# Terminal 3 — Frontend
npm install
npm run dev
```

Open `http://localhost:3000` and start detecting fake internships.
