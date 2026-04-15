<div align="center">
  <h1>🛡️ InternGuard Pro</h1>
  <p><strong>AI-powered Fake Internship & Job Post Detection System built to protect students.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  </p>
</div>

<br />

InternGuard Pro analyzes job or internship descriptions and provides an instant scam risk analysis with a confidence score, risk rating, and automatically flagged suspicious keywords.

## ✨ Key Features

- **🧠 Advanced ML Detection**: TF-IDF + Logistic Regression model to intelligently flag scams.
- **📊 Interactive Analytics Dashboard**: View aggregate network statistics and a ledger of analyzed posts.
- **🏢 Verified Companies Registry**: Easily track, manage, and label companies as verified or unverified.
- **📥 Granular Report Export**: Instantly download dedicated, data-rich **PDF reports** for any individual prediction.
- **⚡ Real-time Feedback Loop**: Safely report posts and incorporate user feedback.

---

## 🏗️ Project Structure

```text
internguard-pro/
├── app/                          # Next.js Frontend
│   ├── analyze/                  # Job description input page
│   ├── dashboard/                # Analytics & company verification
│   ├── result/                   # Analysis result display
│   └── api/                      # Frontend proxies to FastAPI
├── components/                   # Reusable React components
└── backend/                      # FastAPI Python Application
    ├── main.py                   # Route definitions
    ├── database.py               # SQLAlchemy async models
    ├── schema.sql                # PostgreSQL definitions
    └── ml/                       # Machine Learning logic & scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.10+)
- **PostgreSQL** (v14+)

### 1. Database Setup

Create the PostgreSQL database and initialize your tables:

```powershell
psql -U postgres -c "CREATE DATABASE internguard;"
psql -U postgres -d internguard -f backend/schema.sql
```

> **Note:** The default setup connects to `postgresql+asyncpg://postgres:Admin-14@localhost:5432/internguard`. Update your `DATABASE_URL` environment variables if your username/password differs.

### 2. Backend Setup (FastAPI & ML)

Create your virtual environment, install dependencies, and train the initial model:

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Train the ML Model
python -m ml.train

# Start the Backend Server
uvicorn main:app --reload --port 8000
```
> Ensure your API is running and healthy at `http://localhost:8000/health`.

### 3. Frontend Setup (Next.js)

Open a new terminal at the project root:

```powershell
npm install
npm run dev
```

Visit [`http://localhost:3000`](http://localhost:3000) in your browser!

---

## 📡 Core API Endpoints

### Predictions & Feedback
- `POST /predict`: Submit job text for scam risk classification.
- `POST /feedback`: Contribute user feedback regarding prediction accuracy.
- `GET  /dashboard/report/{prediction_id}`: Export highly-styled **PDF Reports** for a single prediction.

### Dashboard & Companies
- `GET  /dashboard/stats`: Retrieve top-level detection metrics.
- `GET  /dashboard/predictions`: Pull historical, filterable scan ledgers.
- `PATCH /dashboard/predictions/{prediction_id}/mark`: Admin flag for confirmed scams.
- `GET  /dashboard/companies`: View actively extracted companies.
- `PATCH /dashboard/companies/{company_id}/verify`: Manage company certification safely.

---

## 🗄️ Database Schema

| Table | Description |
|---|---|
| `job_posts` | Retains raw text, source, and timestamps of all processed posts. |
| `scam_reports` | Maintains manual reports from users flagging certain posts as scams. |
| `predictions` | Stores exact model probabilities, matched keyword arrays, risk scores, and admin marks. |
| `companies` | A dedicated platform registry to catalog companies and `is_verified` standing. |
| `user_feedback` | Stores crowd-sourced feedback to aid future ML iterations. |

---

## 🤖 ML Model Insights

InternGuard Pro relies on a tuned **Logistic Regression** classifier:
- **Feature Extraction**: TF-IDF vectors processing essential unigrams & bigrams.
- **Rule-based Additions**: Checks for exactly 30+ highly-effective binary scam flags (e.g., `"registration fee"`, `"whatsapp only"`).
- **Heuristics**: Tracks excessive capitalization, exclamation counts, and specific currency constraints.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
