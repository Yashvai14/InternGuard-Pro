import os
import csv
import io
import traceback
from typing import Optional, List
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from fpdf import FPDF
from contextlib import asynccontextmanager
from sqlalchemy import select, func, update

from database import Prediction, UserFeedback, Company, init_db, get_session
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


# ─── Request / Response Models ────────────────────────────────────────────────

class PredictRequest(BaseModel):
    text: str
    company_name: Optional[str] = None


class FeedbackRequest(BaseModel):
    prediction_id: int
    is_accurate: bool
    comment: Optional[str] = None


class MarkRequest(BaseModel):
    marked_as_scam: bool


class VerifyCompanyRequest(BaseModel):
    is_verified: bool


# ─── Predict ─────────────────────────────────────────────────────────────────

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
                if req.company_name:
                    # check if company exists, if not create it
                    stmt = select(Company).where(Company.name == req.company_name)
                    existing_company = (await session.execute(stmt)).scalars().first()
                    if not existing_company:
                        new_company = Company(name=req.company_name, is_verified=False)
                        session.add(new_company)
                
                prediction = Prediction(
                    job_text=req.text,
                    company_name=req.company_name,
                    risk_score=result["risk_score"],
                    label=result["label"],
                    confidence=result["confidence"],
                    matched_keywords=result["keywords"],
                    scam_probability=result["scam_probability"],
                    safe_probability=result["safe_probability"],
                    marked_as_scam=False,
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


# ─── Feedback ─────────────────────────────────────────────────────────────────

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


# ─── Dashboard: List all predictions ─────────────────────────────────────────

@app.get("/dashboard/predictions")
async def list_predictions(
    request: Request,
    label: Optional[str] = Query(None),
    marked: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    if not request.app.state.db_available:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        async for session in get_session():
            stmt = select(Prediction).order_by(Prediction.created_at.desc())
            if label:
                stmt = stmt.where(Prediction.label == label)
            if marked is not None:
                stmt = stmt.where(Prediction.marked_as_scam == marked)
            stmt = stmt.limit(limit).offset(offset)
            rows = await session.execute(stmt)
            predictions = rows.scalars().all()
            return [
                {
                    "id": p.id,
                    "company_name": p.company_name,
                    "risk_score": p.risk_score,
                    "label": p.label,
                    "confidence": round(p.confidence * 100, 1),
                    "scam_probability": round((p.scam_probability or 0) * 100, 1),
                    "safe_probability": round((p.safe_probability or 0) * 100, 1),
                    "matched_keywords": p.matched_keywords or [],
                    "marked_as_scam": p.marked_as_scam,
                    "job_text_preview": (p.job_text or "")[:200],
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                }
                for p in predictions
            ]
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Dashboard: Stats ─────────────────────────────────────────────────────────

@app.get("/dashboard/stats")
async def dashboard_stats(request: Request):
    if not request.app.state.db_available:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        async for session in get_session():
            total = (await session.execute(select(func.count()).select_from(Prediction))).scalar()
            scam_count = (await session.execute(
                select(func.count()).select_from(Prediction).where(Prediction.label == "scam")
            )).scalar()
            safe_count = (await session.execute(
                select(func.count()).select_from(Prediction).where(Prediction.label == "safe")
            )).scalar()
            marked_count = (await session.execute(
                select(func.count()).select_from(Prediction).where(Prediction.marked_as_scam == True)
            )).scalar()
            avg_risk = (await session.execute(
                select(func.avg(Prediction.risk_score))
            )).scalar()

            return {
                "total": total or 0,
                "scam": scam_count or 0,
                "safe": safe_count or 0,
                "marked_as_scam": marked_count or 0,
                "avg_risk_score": round(float(avg_risk or 0), 1),
            }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Dashboard: Mark / Unmark as scam ────────────────────────────────────────

@app.patch("/dashboard/predictions/{prediction_id}/mark")
async def mark_prediction(prediction_id: int, req: MarkRequest, request: Request):
    if not request.app.state.db_available:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        async for session in get_session():
            stmt = (
                update(Prediction)
                .where(Prediction.id == prediction_id)
                .values(marked_as_scam=req.marked_as_scam)
            )
            result = await session.execute(stmt)
            await session.commit()
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Prediction not found")
            return {"status": "ok", "marked_as_scam": req.marked_as_scam}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Dashboard: Download report (CSV) per company ────────────────────────────

@app.get("/dashboard/report")
async def download_report(
    request: Request,
    company_name: Optional[str] = Query(None),
):
    if not request.app.state.db_available:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        async for session in get_session():
            stmt = select(Prediction).order_by(Prediction.created_at.desc())
            if company_name:
                stmt = stmt.where(Prediction.company_name == company_name)
            rows = await session.execute(stmt)
            predictions = rows.scalars().all()

            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow([
                "ID", "Company Name", "Risk Score", "Label", "Confidence (%)",
                "Scam Probability (%)", "Safe Probability (%)",
                "Marked As Scam", "Matched Keywords", "Job Text Preview", "Scanned At"
            ])
            for p in predictions:
                writer.writerow([
                    p.id,
                    p.company_name or "N/A",
                    p.risk_score,
                    p.label,
                    round((p.confidence or 0) * 100, 1),
                    round((p.scam_probability or 0) * 100, 1),
                    round((p.safe_probability or 0) * 100, 1),
                    "Yes" if p.marked_as_scam else "No",
                    ", ".join(p.matched_keywords or []),
                    (p.job_text or "")[:300],
                    p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else "",
                ])

            output.seek(0)
            filename = f"internguard_report_{company_name or 'all'}_{datetime.now().strftime('%Y%m%d')}.csv"
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'},
            )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dashboard/report/{prediction_id}")
async def download_prediction_report(prediction_id: int, request: Request):
    if not request.app.state.db_available:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        async for session in get_session():
            stmt = select(Prediction).where(Prediction.id == prediction_id)
            prediction = (await session.execute(stmt)).scalars().first()
            if not prediction:
                raise HTTPException(status_code=404, detail="Prediction not found")

            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("helvetica", style="B", size=16)
            pdf.cell(0, 10, txt="InternGuard Prediction Report", ln=True, align="C")
            pdf.ln(10)

            def add_row(key, val):
                safe_val = str(val).encode("latin-1", "replace").decode("latin-1")
                pdf.set_font("helvetica", style="B", size=11)
                pdf.cell(40, 8, txt=str(key))
                pdf.set_font("helvetica", size=11)
                # handle long text in simple cell if we truncate, or just use multi_cell with a set width
                # actually, to avoid width issues, let's move down manually
                pdf.set_xy(pdf.get_x(), pdf.get_y())
                # Just use multi_cell but explicitly providing width 150
                pdf.multi_cell(150, 8, txt=safe_val)

            add_row("Prediction ID:", prediction.id)
            add_row("Company Name:", prediction.company_name or "N/A")
            add_row("Risk Score:", prediction.risk_score)
            add_row("Label:", prediction.label.upper())
            add_row("Confidence:", f"{round((prediction.confidence or 0) * 100, 1)}%")
            add_row("Scam Prob:", f"{round((prediction.scam_probability or 0) * 100, 1)}%")
            add_row("Safe Prob:", f"{round((prediction.safe_probability or 0) * 100, 1)}%")
            add_row("Marked Scam:", "Yes" if prediction.marked_as_scam else "No")
            add_row("Matched KWs:", ", ".join(prediction.matched_keywords or []) or "None")
            add_row("Scanned At:", prediction.created_at.strftime("%Y-%m-%d %H:%M:%S") if prediction.created_at else "N/A")
            
            pdf.ln(5)
            pdf.set_font("helvetica", style="B", size=12)
            pdf.cell(0, 10, txt="Job Text Extract:", ln=True)
            pdf.set_font("helvetica", size=10)
            safe_text = (prediction.job_text or "").encode("latin-1", "replace").decode("latin-1")
            pdf.multi_cell(0, 6, txt=safe_text[:1500] + ("..." if len(safe_text) > 1500 else ""))

            pdf_bytes = bytes(pdf.output())
            filename = f"internguard_prediction_{prediction_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'},
            )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Dashboard: Companies ────────────────────────────────────────────────────

@app.get("/dashboard/companies")
async def list_companies(request: Request):
    if not request.app.state.db_available:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        async for session in get_session():
            stmt = select(Company).order_by(Company.name.asc())
            rows = await session.execute(stmt)
            companies = rows.scalars().all()
            return [
                {
                    "id": c.id,
                    "name": c.name,
                    "is_verified": c.is_verified,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
                for c in companies
            ]
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/dashboard/companies/{company_id}/verify")
async def verify_company(company_id: int, req: VerifyCompanyRequest, request: Request):
    if not request.app.state.db_available:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        async for session in get_session():
            stmt = (
                update(Company)
                .where(Company.id == company_id)
                .values(is_verified=req.is_verified)
            )
            result = await session.execute(stmt)
            await session.commit()
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Company not found")
            return {"status": "ok", "is_verified": req.is_verified}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy"}
