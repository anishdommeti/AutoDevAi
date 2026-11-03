from fastapi import APIRouter
from app.config import settings
from app.services.gemini import GeminiService

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "gemini_configured": GeminiService.is_configured(),
        "gemini_model": settings.GEMINI_MODEL,
    }

