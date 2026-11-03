import os
from fastapi import APIRouter
from app.config import settings
from app.models.settings import (
    SettingsResponse,
    ConnectionTestResponse,
    DashboardMetrics,
)
from app.services.gemini import GeminiService
from app.services.storage import StorageService

router = APIRouter(tags=["Settings & Dashboard"])

@router.get("/settings", response_model=SettingsResponse)
def get_system_settings():
    projects = StorageService.list_projects()
    total_files = sum(p.file_count for p in projects)
    total_size = sum(p.total_size_bytes for p in projects) / (1024 * 1024)

    return SettingsResponse(
        app_name=settings.APP_NAME,
        version=settings.VERSION,
        gemini_configured=GeminiService.is_configured(),
        gemini_model=settings.GEMINI_MODEL,
        data_dir=str(settings.DATA_DIR),
        total_projects=len(projects),
        total_files=total_files,
        total_size_mb=round(total_size, 2)
    )

@router.post("/settings/test-connection", response_model=ConnectionTestResponse)
async def test_gemini_connection():
    return await GeminiService.test_connection()

@router.get("/dashboard/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics():
    return StorageService.get_dashboard_metrics()

