from typing import List
from fastapi import APIRouter, Query, HTTPException
from app.models.project import (
    ProjectFile,
    FileCreateRequest,
    FileUpdateRequest,
    FileRenameRequest,
)
from app.services.storage import StorageService

router = APIRouter(prefix="/projects/{project_id}/files", tags=["Files"])

@router.get("", response_model=List[ProjectFile])
def get_file_tree(project_id: str):
    return StorageService.get_file_tree(project_id)

@router.get("/content")
def read_file_content(project_id: str, path: str = Query(..., description="Relative file path")):
    content = StorageService.read_file(project_id, path)
    return {"path": path, "content": content}

@router.post("", status_code=201)
def create_file(project_id: str, req: FileCreateRequest):
    StorageService.write_file(project_id, req.path, req.content)
    return {"success": True, "path": req.path}

@router.put("")
def update_file_content(project_id: str, path: str = Query(..., description="Relative file path"), req: FileUpdateRequest = None):
    if req is None:
        raise HTTPException(status_code=400, detail="Missing request body")
    StorageService.write_file(project_id, path, req.content)
    return {"success": True, "path": path}

@router.delete("")
def delete_file(project_id: str, path: str = Query(..., description="Relative file path")):
    StorageService.delete_file(project_id, path)
    return {"success": True, "path": path}

@router.post("/rename")
def rename_file(project_id: str, old_path: str = Query(..., description="Existing file path"), req: FileRenameRequest = None):
    if req is None or not req.new_path:
        raise HTTPException(status_code=400, detail="Missing new_path in request")
    StorageService.rename_file(project_id, old_path, req.new_path)
    return {"success": True, "old_path": old_path, "new_path": req.new_path}

