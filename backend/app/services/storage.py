import os
import re
import json
import uuid
import shutil
import zipfile
import io
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
from fastapi import HTTPException

from app.config import settings
from app.models.project import (
    ProjectMetadata,
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectFile,
)
from app.models.settings import ActivityItem, DashboardMetrics

# Lock for thread-safe metadata operations
_storage_lock = threading.Lock()

def sanitize_name(name: str) -> str:
    """Sanitize a project or file name for filesystem safety."""
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name).strip()
    return cleaned if cleaned else "untitled"

def resolve_safe_path(project_id: str, relative_path: str) -> Path:
    """
    Ensure the resolved path stays strictly within the authorized project directory.
    Rejects directory traversal (e.g. '../', null bytes).
    """
    if "\0" in relative_path:
        raise HTTPException(status_code=400, detail="Invalid character in file path")
    
    project_dir = (settings.DATA_DIR / project_id).resolve()
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Normalize path
    clean_rel = os.path.normpath(relative_path.lstrip("/\\"))
    target_path = (project_dir / clean_rel).resolve()
    
    # Check if target_path starts with project_dir
    try:
        target_path.relative_to(project_dir)
    except ValueError:
        raise HTTPException(status_code=400, detail="Access denied: Path traversal detected")
        
    return target_path

def atomic_write_json(file_path: Path, data: dict):
    """Write JSON data atomically using a temporary file."""
    temp_path = file_path.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    # On Windows, os.replace replaces atomically if on same volume
    os.replace(temp_path, file_path)

def atomic_write_text(file_path: Path, content: str):
    """Write text data atomically using a temporary file."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = file_path.with_suffix(file_path.suffix + ".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        f.write(content)
    os.replace(temp_path, file_path)

class StorageService:
    @staticmethod
    def log_activity(project_id: str, project_name: str, activity_type: str, description: str):
        """Append an activity item to global activities."""
        activity_file = settings.DATA_DIR.parent / "activities.json"
        with _storage_lock:
            activities = []
            if activity_file.exists():
                try:
                    with open(activity_file, "r", encoding="utf-8") as f:
                        activities = json.load(f)
                except Exception:
                    activities = []
            
            item = {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "project_name": project_name,
                "activity_type": activity_type,
                "description": description,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            # Keep latest 100 activities
            activities.insert(0, item)
            activities = activities[:100]
            try:
                atomic_write_json(activity_file, activities)
            except Exception:
                pass

    @staticmethod
    def get_activities(limit: int = 20) -> List[ActivityItem]:
        """Get recent activities."""
        activity_file = settings.DATA_DIR.parent / "activities.json"
        if not activity_file.exists():
            return []
        try:
            with open(activity_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            return [ActivityItem(**item) for item in data[:limit]]
        except Exception:
            return []

    @staticmethod
    def create_project(req: ProjectCreateRequest) -> ProjectMetadata:
        """Create a new project directory and metadata."""
        project_id = str(uuid.uuid4())
        project_dir = settings.DATA_DIR / project_id
        project_dir.mkdir(parents=True, exist_ok=False)

        now = datetime.now(timezone.utc)
        meta = ProjectMetadata(
            id=project_id,
            name=sanitize_name(req.name),
            description=req.description,
            category=req.category,
            target_output=req.target_output,
            design_style=req.design_style,
            color_scheme=req.color_scheme,
            created_at=now,
            updated_at=now,
            status="created",
            file_count=0,
            total_size_bytes=0,
        )

        with _storage_lock:
            atomic_write_json(project_dir / "project.json", meta.model_dump())
        
        StorageService.log_activity(
            project_id=project_id,
            project_name=meta.name,
            activity_type="created",
            description=f"Project '{meta.name}' created."
        )
        return meta

    @staticmethod
    def list_projects() -> List[ProjectMetadata]:
        """List all projects sorted by updated_at descending."""
        projects = []
        if not settings.DATA_DIR.exists():
            return projects

        for entry in settings.DATA_DIR.iterdir():
            if entry.is_dir():
                meta_path = entry / "project.json"
                if meta_path.exists():
                    try:
                        with open(meta_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                        meta = ProjectMetadata(**data)
                        projects.append(meta)
                    except Exception as e:
                        # Log and skip corrupted metadata without crashing
                        print(f"Warning: Corrupted metadata for {entry.name}: {e}")
        
        projects.sort(key=lambda p: p.updated_at, reverse=True)
        return projects

    @staticmethod
    def get_project(project_id: str) -> ProjectMetadata:
        """Get project metadata."""
        meta_path = settings.DATA_DIR / project_id / "project.json"
        if not meta_path.exists():
            raise HTTPException(status_code=404, detail="Project not found")
        
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return ProjectMetadata(**data)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read project metadata: {e}")

    @staticmethod
    def update_project(project_id: str, req: ProjectUpdateRequest) -> ProjectMetadata:
        """Update project metadata."""
        meta = StorageService.get_project(project_id)
        if req.name is not None:
            meta.name = sanitize_name(req.name)
        if req.description is not None:
            meta.description = req.description
        if req.category is not None:
            meta.category = req.category
        if req.design_style is not None:
            meta.design_style = req.design_style
        if req.color_scheme is not None:
            meta.color_scheme = req.color_scheme
        if req.tags is not None:
            meta.tags = req.tags
            
        meta.updated_at = datetime.now(timezone.utc)

        with _storage_lock:
            meta_path = settings.DATA_DIR / project_id / "project.json"
            atomic_write_json(meta_path, meta.model_dump())
            
        StorageService.log_activity(
            project_id=project_id,
            project_name=meta.name,
            activity_type="edited",
            description=f"Project '{meta.name}' settings updated."
        )
        return meta

    @staticmethod
    def save_metadata(meta: ProjectMetadata):
        """Save updated metadata directly."""
        meta.updated_at = datetime.now(timezone.utc)
        meta_path = settings.DATA_DIR / meta.id / "project.json"
        with _storage_lock:
            atomic_write_json(meta_path, meta.model_dump())

    @staticmethod
    def delete_project(project_id: str):
        """Delete project directory completely."""
        meta = StorageService.get_project(project_id)
        project_dir = settings.DATA_DIR / project_id
        try:
            shutil.rmtree(project_dir)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete project: {e}")
        
        StorageService.log_activity(
            project_id=project_id,
            project_name=meta.name,
            activity_type="deleted",
            description=f"Project '{meta.name}' deleted."
        )

    @staticmethod
    def duplicate_project(project_id: str, new_name: Optional[str] = None) -> ProjectMetadata:
        """Duplicate an existing project into a new one."""
        meta = StorageService.get_project(project_id)
        source_dir = settings.DATA_DIR / project_id
        
        target_name = new_name or f"{meta.name} (Copy)"
        new_project_req = ProjectCreateRequest(
            name=target_name,
            description=meta.description,
            category=meta.category,
            target_output=meta.target_output,
            design_style=meta.design_style,
            color_scheme=meta.color_scheme,
        )
        new_meta = StorageService.create_project(new_project_req)
        target_dir = settings.DATA_DIR / new_meta.id
        
        # Copy all files except project.json
        for item in source_dir.iterdir():
            if item.name == "project.json":
                continue
            dest = target_dir / item.name
            if item.is_dir():
                shutil.copytree(item, dest)
            else:
                shutil.copy2(item, dest)
                
        # Recalculate stats for duplicated project
        StorageService.recalculate_project_stats(new_meta.id)
        new_meta = StorageService.get_project(new_meta.id)
        new_meta.status = meta.status
        StorageService.save_metadata(new_meta)
        
        StorageService.log_activity(
            project_id=new_meta.id,
            project_name=new_meta.name,
            activity_type="created",
            description=f"Duplicated from '{meta.name}'."
        )
        return new_meta

    @staticmethod
    def recalculate_project_stats(project_id: str):
        """Recalculate file count and total size of a project."""
        project_dir = settings.DATA_DIR / project_id
        if not project_dir.exists():
            return
            
        file_count = 0
        total_size = 0
        
        for root, dirs, files in os.walk(project_dir):
            for file in files:
                if file == "project.json" or file.endswith(".tmp"):
                    continue
                file_count += 1
                try:
                    total_size += os.path.getsize(os.path.join(root, file))
                except Exception:
                    pass
                    
        meta = StorageService.get_project(project_id)
        meta.file_count = file_count
        meta.total_size_bytes = total_size
        StorageService.save_metadata(meta)

    @staticmethod
    def get_file_tree(project_id: str) -> List[ProjectFile]:
        """Return the nested tree of files for a project."""
        project_dir = (settings.DATA_DIR / project_id).resolve()
        if not project_dir.exists():
            raise HTTPException(status_code=404, detail="Project not found")

        def build_node(current_path: Path) -> Optional[ProjectFile]:
            rel_path = current_path.relative_to(project_dir).as_posix()
            if rel_path == "project.json" or current_path.name.endswith(".tmp"):
                return None
                
            if current_path.is_dir():
                children = []
                for child in sorted(current_path.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
                    node = build_node(child)
                    if node:
                        children.append(node)
                return ProjectFile(
                    path=rel_path if rel_path != "." else "",
                    name=current_path.name,
                    is_dir=True,
                    children=children,
                    updated_at=datetime.fromtimestamp(current_path.stat().st_mtime, tz=timezone.utc),
                )
            else:
                stat = current_path.stat()
                return ProjectFile(
                    path=rel_path,
                    name=current_path.name,
                    is_dir=False,
                    size=stat.st_size,
                    extension=current_path.suffix.lstrip(".").lower(),
                    updated_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc),
                )

        root_children = []
        for child in sorted(project_dir.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
            node = build_node(child)
            if node:
                root_children.append(node)
                
        return root_children

    @staticmethod
    def read_file(project_id: str, relative_path: str) -> str:
        """Read a file's content as text."""
        target_path = resolve_safe_path(project_id, relative_path)
        if not target_path.exists() or not target_path.is_file():
            raise HTTPException(status_code=404, detail=f"File not found: {relative_path}")
            
        try:
            with open(target_path, "r", encoding="utf-8") as f:
                return f.read()
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="Cannot read binary file as text")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")

    @staticmethod
    def write_file(project_id: str, relative_path: str, content: str):
        """Write content to a file atomically."""
        if len(content.encode("utf-8")) > settings.MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit")
            
        target_path = resolve_safe_path(project_id, relative_path)
        atomic_write_text(target_path, content)
        
        StorageService.recalculate_project_stats(project_id)
        meta = StorageService.get_project(project_id)
        meta.updated_at = datetime.now(timezone.utc)
        StorageService.save_metadata(meta)

    @staticmethod
    def delete_file(project_id: str, relative_path: str):
        """Delete a file or folder safely."""
        target_path = resolve_safe_path(project_id, relative_path)
        if not target_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
            
        if target_path.name == "project.json":
            raise HTTPException(status_code=400, detail="Cannot delete project metadata directly")
            
        if target_path.is_dir():
            shutil.rmtree(target_path)
        else:
            target_path.unlink()
            
        StorageService.recalculate_project_stats(project_id)

    @staticmethod
    def rename_file(project_id: str, old_path: str, new_path: str):
        """Rename or move a file within the project."""
        old_target = resolve_safe_path(project_id, old_path)
        new_target = resolve_safe_path(project_id, new_path)
        
        if not old_target.exists():
            raise HTTPException(status_code=404, detail="Source file not found")
        if new_target.exists():
            raise HTTPException(status_code=400, detail="Destination file already exists")
            
        new_target.parent.mkdir(parents=True, exist_ok=True)
        old_target.rename(new_target)
        StorageService.recalculate_project_stats(project_id)

    @staticmethod
    def create_project_zip(project_id: str) -> io.BytesIO:
        """Create a zip archive of the project in memory."""
        meta = StorageService.get_project(project_id)
        project_dir = settings.DATA_DIR / project_id
        
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(project_dir):
                for file in files:
                    if file.endswith(".tmp"):
                        continue
                    full_path = Path(root) / file
                    rel_path = full_path.relative_to(project_dir)
                    zf.write(full_path, arcname=str(rel_path))
                    
        buf.seek(0)
        StorageService.log_activity(
            project_id=project_id,
            project_name=meta.name,
            activity_type="exported",
            description=f"Exported project '{meta.name}' as ZIP archive."
        )
        return buf

    @staticmethod
    def get_dashboard_metrics() -> DashboardMetrics:
        """Calculate real statistics from all persisted projects."""
        projects = StorageService.list_projects()
        
        total_projects = len(projects)
        ready_projects = sum(1 for p in projects if p.status == "ready")
        generating_projects = sum(1 for p in projects if p.status == "generating")
        failed_projects = sum(1 for p in projects if p.status == "failed")
        total_files = sum(p.file_count for p in projects)
        
        # Calculate approximate lines of code from files
        total_loc = 0
        for p in projects:
            p_dir = settings.DATA_DIR / p.id
            if p_dir.exists():
                for root, dirs, files in os.walk(p_dir):
                    for f in files:
                        if f in ["project.json"] or f.endswith(".tmp"):
                            continue
                        f_path = Path(root) / f
                        if f_path.suffix.lower() in [".html", ".css", ".js", ".json", ".md", ".ts", ".jsx", ".tsx"]:
                            try:
                                with open(f_path, "r", encoding="utf-8", errors="ignore") as file_obj:
                                    total_loc += sum(1 for _ in file_obj)
                            except Exception:
                                pass
                                
        # Category breakdown
        category_dist: Dict[str, int] = {}
        for p in projects:
            cat = p.category or "Other"
            category_dist[cat] = category_dist.get(cat, 0) + 1
            
        recent_activity = StorageService.get_activities(limit=10)
        
        return DashboardMetrics(
            total_projects=total_projects,
            ready_projects=ready_projects,
            generating_projects=generating_projects,
            failed_projects=failed_projects,
            total_files=total_files,
            total_lines_of_code=total_loc,
            recent_activity=recent_activity,
            category_distribution=category_dist,
        )

