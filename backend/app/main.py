import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.config import settings
from app.api.router import api_router
from app.services.preview import PreviewService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("autodev.main")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Autonomous Coding Agent Using Generative AI Backend API",
    docs_url=f"{settings.API_PREFIX}/docs",
    openapi_url=f"{settings.API_PREFIX}/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local development preview and frontend ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe error handling to protect against secret leakage in traces
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    # Redact potential keys from exception text
    msg = str(exc)
    if "AIza" in msg:
        msg = "Internal API error (credentials redacted)"
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred", "message": msg}
    )

# Include API v1 router
app.include_router(api_router, prefix=settings.API_PREFIX)

# Preview endpoints for generated applications
@app.get("/preview/{project_id}")
@app.get("/preview/{project_id}/{file_path:path}")
def serve_preview(project_id: str, file_path: str = ""):
    return PreviewService.serve_preview_file(project_id, file_path)

@app.get("/")
def root_status():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "online",
        "api_docs": f"{settings.API_PREFIX}/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

