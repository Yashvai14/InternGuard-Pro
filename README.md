<div align="center">
  <h1>🛡️ InternGuard Pro</h1>
  <p><strong>AI-powered Fake Internship & Job Post Detection System built to protect students.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Ollama-FFFFFF?style=for-the-badge&logo=ollama&logoColor=black" alt="Ollama" />
  </p>
</div>

<br />

InternGuard Pro analyzes job or internship descriptions and provides an instant scam risk analysis. It uses a **Hybrid AI Engine** combining a traditional Machine Learning `RandomForestClassifier` with deep semantic analysis from an **Ollama (`llama3`)** local Large Language Model to deliver unparalleled accuracy, live suggestions, and an interactive chat assistant.

## ✨ Key Features

- **🧠 Hybrid AI Detection**: Blends probabilities from a `RandomForestClassifier` (trained on a comprehensive custom dataset) and a Local LLM (`llama3`).
- **💬 Interactive Live Assistant**: Chat directly with the AI on the result page to ask follow-up questions about specific red flags or the job description.
- **💡 Live AI Suggestions**: Automatically generates actionable advice and extracts highly specific red flags explaining *why* a post is a scam.
- **📊 Analytics Dashboard**: View aggregate network statistics, manage verified companies, and track all analyzed posts.
- **📥 Pixel-Perfect PDF Reports**: Download perfectly aligned, data-rich PDF reports containing the full AI analysis for any prediction.

---

## 🏗️ Project Structure

```text
internguard-pro/
├── app/                          # Next.js Frontend
│   ├── analyze/                  # Job description input page
│   ├── dashboard/                # Analytics & company verification
│   ├── result/                   # Analysis result & Live Chatbox
│   └── api/                      # Frontend proxies to FastAPI
├── components/                   # Reusable React components
└── backend/                      # FastAPI Python Application
    ├── main.py                   # API routes (Predict, Chat, Dashboard, PDF)
    ├── database.py               # SQLAlchemy async models
    ├── schema.sql                # PostgreSQL definitions
    └── ml/                       # Machine Learning & Ollama integration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.10+)
- **PostgreSQL** (v14+)
- **Ollama**: Installed locally with the `llama3` model pulled (`ollama run llama3`).

### 1. Database Setup

Create the PostgreSQL database and initialize your tables:

```powershell
psql -U postgres -c "CREATE DATABASE internguard;"
psql -U postgres -d internguard -f backend/schema.sql
```

> **Note:** The default setup connects to `postgresql+asyncpg://postgres:Admin-14@localhost:5432/internguard`. Update your `DATABASE_URL` environment variables if your username/password differs.

### 2. Backend Setup (FastAPI, ML, & Ollama)

Create your virtual environment, install dependencies, and train the initial model:

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Ensure Ollama is running in the background
# ollama run llama3

# Train the ML Model on the expanded dataset
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

### Predictions & AI Chat
- `POST /predict`: Submit job text. Triggers the Hybrid ML + Ollama pipeline for scam risk classification.
- `POST /chat`: Interactive endpoint to chat with Ollama regarding a specific job posting.
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
| `predictions` | Stores exact probabilities, risk scores, Ollama explanations, AI-identified red flags, and admin marks. |
| `companies` | A dedicated platform registry to catalog companies and `is_verified` standing. |
| `user_feedback` | Stores crowd-sourced feedback to aid future ML iterations. |

---

## 🤖 AI & ML Model Insights

InternGuard Pro relies on a state-of-the-art **Hybrid Engine**:
1. **Random Forest Classifier**: 
   - **Feature Extraction**: TF-IDF vectors processing essential unigrams & bigrams.
   - **Rule-based Additions**: Checks for 50+ highly-effective binary scam flags (e.g., `"crypto investment"`, `"wire transfer"`, `"multi-level marketing"`).
2. **Local LLM (Ollama / Llama 3)**:
   - Evaluates the job description semantically to catch sophisticated, modern scams that bypass keyword filters.
   - Generates human-readable explanations and actionable live suggestions for the user.
3. **Probability Blending**: The system fuses the predictions from both models (50/50 split) to produce an incredibly accurate, robust confidence score.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
