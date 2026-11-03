import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "AutoDevAI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Gemini AI configuration
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Storage settings
    DATA_DIR: Path = Path(__file__).resolve().parent.parent.parent / "data" / "projects"
    
    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Limits & Security
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB
    MAX_PROJECT_FILES: int = 200
    MAX_REPAIR_ATTEMPTS: int = 3
    REQUEST_TIMEOUT_SECONDS: int = 60
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()

# Ensure DATA_DIR exists
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)

