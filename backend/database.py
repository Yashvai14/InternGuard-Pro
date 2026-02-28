import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, Float, Boolean, Text, ARRAY, TIMESTAMP, func

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/internguard")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class JobPost(Base):
    __tablename__ = "job_posts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str | None] = mapped_column(String(100))
    created_at = mapped_column(TIMESTAMP, server_default=func.now())


class ScamReport(Base):
    __tablename__ = "scam_reports"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_post_id: Mapped[int | None] = mapped_column(Integer)
    reporter_reason: Mapped[str | None] = mapped_column(Text)
    reported_at = mapped_column(TIMESTAMP, server_default=func.now())


class Prediction(Base):
    __tablename__ = "predictions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_text: Mapped[str] = mapped_column(Text, nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(String(10), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    matched_keywords = mapped_column(ARRAY(String(255)))
    scam_probability: Mapped[float | None] = mapped_column(Float)
    safe_probability: Mapped[float | None] = mapped_column(Float)
    created_at = mapped_column(TIMESTAMP, server_default=func.now())


class UserFeedback(Base):
    __tablename__ = "user_feedback"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(Integer)
    is_accurate: Mapped[bool] = mapped_column(Boolean, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    created_at = mapped_column(TIMESTAMP, server_default=func.now())


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session():
    async with async_session() as session:
        yield session
