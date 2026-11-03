from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.projects import router as projects_router
from app.api.files import router as files_router
from app.api.generation import router as generation_router
from app.api.validation import router as validation_router
from app.api.ai import router as ai_router
from app.api.export import router as export_router
from app.api.settings import router as settings_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(projects_router)
api_router.include_router(files_router)
api_router.include_router(generation_router)
api_router.include_router(validation_router)
api_router.include_router(ai_router)
api_router.include_router(export_router)
api_router.include_router(settings_router)

