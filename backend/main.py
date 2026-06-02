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


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    job_text: str
    messages: List[ChatMessage]

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
                    safe_probability=result["safe_probability"],
                    explanation=result.get("explanation"),
                    ollama_flags=result.get("ollama_flags"),
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
        "job_text": req.text,
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


# ─── Chat ─────────────────────────────────────────────────────────────────────

import httpx

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if not req.job_text.strip():
        raise HTTPException(status_code=400, detail="Job text cannot be empty")
        
    system_prompt = (
        "You are an expert fraud detection AI assistant for InternGuard. "
        "Your role is to help users understand why a specific job posting is safe or a scam, "
        "and answer any questions they have about the job posting. "
        "Here is the job posting in question:\n\n"
        f"--- JOB POSTING ---\n{req.job_text}\n--- END JOB POSTING ---\n\n"
        "Please provide helpful, clear, and concise answers based on the text above. Keep responses short."
    )
    
    formatted_messages = [{"role": "system", "content": system_prompt}]
    for msg in req.messages:
        formatted_messages.append({"role": msg.role, "content": msg.content})

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                "http://localhost:11434/api/chat",
                json={
                    "model": "llama3",
                    "messages": formatted_messages,
                    "stream": False
                }
            )
            resp.raise_for_status()
            data = resp.json()
            reply = data.get("message", {}).get("content", "Sorry, I couldn't process that.")
            return {"reply": reply}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

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
            
            # --- Title & Header ---
            pdf.set_font("helvetica", style="B", size=20)
            pdf.set_text_color(0, 51, 102) # Dark blue
            pdf.cell(0, 15, txt="InternGuard Analysis Report", ln=True, align="C")
            
            # Separator line
            pdf.set_draw_color(0, 51, 102)
            pdf.set_line_width(0.5)
            pdf.line(10, 25, 200, 25)
            pdf.ln(5)

            # Helper for section headers
            def section_header(title):
                pdf.ln(5)
                pdf.set_font("helvetica", style="B", size=12)
                pdf.set_text_color(255, 255, 255)
                pdf.set_fill_color(0, 102, 204)
                pdf.cell(0, 8, txt=f"  {title}", ln=True, fill=True)
                pdf.ln(2)

            def add_row(key, val, y_offset=0):
                safe_val = str(val).encode("latin-1", "replace").decode("latin-1")
                # Store current Y
                current_y = pdf.get_y() + y_offset
                
                # Draw Key at X=15
                pdf.set_xy(15, current_y)
                pdf.set_font("helvetica", style="B", size=10)
                pdf.set_text_color(0, 0, 0)
                pdf.cell(45, 6, txt=str(key))
                
                # Draw Value at X=60
                pdf.set_xy(60, current_y)
                pdf.set_font("helvetica", size=10)
                pdf.set_text_color(50, 50, 50)
                pdf.multi_cell(135, 6, txt=safe_val)
                # Next line is determined by multi_cell's effect on Y
                pdf.ln(2)

            # --- 1. Basic Information ---
            section_header("1. Basic Information")
            add_row("Prediction ID:", prediction.id, y_offset=2)
            add_row("Company Name:", prediction.company_name or "N/A")
            add_row("Scanned At:", prediction.created_at.strftime("%Y-%m-%d %H:%M:%S") if prediction.created_at else "N/A")
            add_row("Marked as Scam:", "Yes (Manually Flagged)" if prediction.marked_as_scam else "No")

            # --- 2. Risk Assessment ---
            section_header("2. Risk Assessment")
            
            # Custom label row
            current_y = pdf.get_y() + 2
            pdf.set_xy(15, current_y)
            pdf.set_font("helvetica", style="B", size=10)
            pdf.set_text_color(0, 0, 0)
            pdf.cell(45, 6, txt="Classification:")
            
            pdf.set_xy(60, current_y)
            label_text = prediction.label.upper()
            if label_text == "SCAM":
                pdf.set_text_color(204, 0, 0) # Red
            else:
                pdf.set_text_color(0, 153, 0) # Green
            pdf.set_font("helvetica", style="B", size=10)
            pdf.cell(135, 6, txt=label_text, ln=True)
            pdf.ln(2)
            
            # Reset colors
            pdf.set_text_color(0, 0, 0)
            add_row("Risk Score:", f"{prediction.risk_score} / 100")
            add_row("AI Confidence:", f"{round((prediction.confidence or 0) * 100, 1)}%")
            add_row("Scam Probability:", f"{round((prediction.scam_probability or 0) * 100, 1)}%")
            add_row("Safe Probability:", f"{round((prediction.safe_probability or 0) * 100, 1)}%")
            add_row("Matched Keywords:", ", ".join(prediction.matched_keywords or []) or "None Detected")

            # --- 3. AI Explanation (Ollama) ---
            section_header("3. Detailed AI Analysis")
            pdf.ln(2)
            pdf.set_font("helvetica", style="I", size=10)
            pdf.set_text_color(40, 40, 40)
            explanation_text = getattr(prediction, "explanation", None) or "No detailed explanation available for this report."
            safe_explanation = explanation_text.encode("latin-1", "replace").decode("latin-1")
            
            # Store X/Y to add an indent
            pdf.set_x(15)
            pdf.multi_cell(180, 6, txt=safe_explanation)
            
            ollama_flags = getattr(prediction, "ollama_flags", [])
            if ollama_flags and len(ollama_flags) > 0:
                pdf.ln(2)
                pdf.set_x(15)
                pdf.set_font("helvetica", style="B", size=10)
                pdf.cell(0, 6, txt="Identified Red Flags:", ln=True)
                pdf.set_font("helvetica", size=10)
                pdf.set_text_color(204, 0, 0)
                for flag in ollama_flags:
                    pdf.set_x(20)
                    safe_flag = str(flag).encode("latin-1", "replace").decode("latin-1")
                    pdf.multi_cell(170, 6, txt=f"- {safe_flag}")

            # --- 4. Job Description Extract ---
            section_header("4. Job Description Extract")
            pdf.ln(2)
            pdf.set_font("helvetica", size=9)
            pdf.set_text_color(60, 60, 60)
            pdf.set_fill_color(245, 245, 245)
            pdf.set_draw_color(200, 200, 200)
            
            safe_text = (prediction.job_text or "").encode("latin-1", "replace").decode("latin-1")
            display_text = safe_text[:2000] + ("\n\n[...Truncated due to length...]" if len(safe_text) > 2000 else "")
            
            # Output with a light border and background
            pdf.multi_cell(0, 5, txt=display_text, border=1, fill=True)

            # Footer
            pdf.ln(10)
            pdf.set_font("helvetica", style="I", size=8)
            pdf.set_text_color(150, 150, 150)
            pdf.cell(0, 10, txt="This report was automatically generated by the InternGuard AI assessment tool.", ln=True, align="C")

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
