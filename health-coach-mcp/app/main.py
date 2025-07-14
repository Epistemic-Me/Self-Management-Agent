"""
Health Coach MCP Service - Main Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.routers import chat, cohorts, intents, evaluation, health, component_testing
from app.services.database import init_db

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    logger.info("Starting Health Coach MCP Service")
    # Initialize database
    await init_db()
    yield
    logger.info("Shutting down Health Coach MCP Service")


app = FastAPI(
    title="Health Coach MCP",
    description="AI-powered health coaching with hierarchical constraint evaluation",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(cohorts.router, prefix="/cohorts", tags=["cohorts"])
app.include_router(intents.router, prefix="/intents", tags=["intents"])
app.include_router(evaluation.router, prefix="/evaluate", tags=["evaluation"])
app.include_router(component_testing.router, prefix="/component", tags=["component-testing"])
app.include_router(health.router, prefix="/health", tags=["health"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Health Coach MCP",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }