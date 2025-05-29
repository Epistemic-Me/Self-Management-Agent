"""
Main FastAPI application for em-mcp service.
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi_mcp import FastApiMCP
from dotenv import load_dotenv

from .routers import self_model, belief, dialectic
from .em_sdk_client import close_clients

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting em-mcp service")
    yield
    logger.info("Shutting down em-mcp service")
    await close_clients()


# Create FastAPI app
app = FastAPI(
    title="em-mcp",
    description="FastAPI + fastapi-mcp proxy for Epistemic Me",
    version="1.0.0",
    lifespan=lifespan
)

# Create FastApiMCP wrapper
mcp_app = FastApiMCP(app)

# Include routers
app.include_router(self_model.router, tags=["self-model"])
app.include_router(belief.router, tags=["belief"])
app.include_router(dialectic.router, tags=["dialectic"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "em-mcp"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "em-mcp",
        "description": "FastAPI + fastapi-mcp proxy for Epistemic Me",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8120))
    uvicorn.run(app, host="0.0.0.0", port=port) 