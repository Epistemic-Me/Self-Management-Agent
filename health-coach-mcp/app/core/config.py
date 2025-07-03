"""
Configuration for Health Coach MCP Service
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    # Service Configuration
    SERVICE_NAME: str = "health-coach-mcp"
    SERVICE_PORT: int = 8130
    LOG_LEVEL: str = "INFO"
    
    # OpenAI Configuration
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Service URLs
    PROFILE_MCP_URL: str = "http://profile-mcp:8010"
    EM_MCP_URL: str = "http://em-mcp:8120"
    DD_MCP_URL: str = "http://dd-mcp:8090"
    
    # Database Configuration
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/health_coach"
    REDIS_URL: str = "redis://redis:6379/3"
    
    # Authentication
    API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()