from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from app.models.project import (
    ProjectMetadata,
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectDuplicateRequest,
)
from app.services.storage import StorageService

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectMetadata])
def list_projects(
    search: Optional[str] = Query(None, description="Search term for project name or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status (created, generating, ready, failed)"),
    sort_by: str = Query("updated_at", description="Sort field: updated_at, created_at, name, file_count"),
    order: str = Query("desc", description="Sort order: asc, desc"),
):
    projects = StorageService.list_projects()

    if search:
        s = search.lower()
        projects = [p for p in projects if s in p.name.lower() or s in p.description.lower()]

    if category and category != "all":
        projects = [p for p in projects if p.category.lower() == category.lower()]

    if status and status != "all":
        projects = [p for p in projects if p.status.lower() == status.lower()]

    reverse = order.lower() == "desc"
    if sort_by == "name":
        projects.sort(key=lambda p: p.name.lower(), reverse=reverse)
    elif sort_by == "created_at":
        projects.sort(key=lambda p: p.created_at, reverse=reverse)
    elif sort_by == "file_count":
        projects.sort(key=lambda p: p.file_count, reverse=reverse)
    else:  # updated_at
        projects.sort(key=lambda p: p.updated_at, reverse=reverse)

    return projects

@router.post("", response_model=ProjectMetadata, status_code=201)
def create_project(req: ProjectCreateRequest):
    return StorageService.create_project(req)

@router.get("/{project_id}", response_model=ProjectMetadata)
def get_project(project_id: str):
    return StorageService.get_project(project_id)

@router.put("/{project_id}", response_model=ProjectMetadata)
def update_project(project_id: str, req: ProjectUpdateRequest):
    return StorageService.update_project(project_id, req)

@router.delete("/{project_id}")
def delete_project(project_id: str):
    StorageService.delete_project(project_id)
    return {"success": True, "message": "Project deleted successfully"}

@router.post("/{project_id}/duplicate", response_model=ProjectMetadata)
def duplicate_project(project_id: str, req: ProjectDuplicateRequest):
    return StorageService.duplicate_project(project_id, req.new_name)

