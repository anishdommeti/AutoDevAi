from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.services.storage import StorageService

router = APIRouter(prefix="/projects/{project_id}/export", tags=["Export"])

@router.get("")
def export_project_zip(project_id: str):
    meta = StorageService.get_project(project_id)
    zip_buffer = StorageService.create_project_zip(project_id)
    filename = f"{meta.name.replace(' ', '_').lower()}_{project_id[:8]}.zip"
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

