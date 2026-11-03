from datetime import datetime, timezone
from typing import List, Optional, Any
from pydantic import BaseModel, Field

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class ProjectFile(BaseModel):
    path: str
    name: str
    is_dir: bool = False
    size: int = 0
    extension: Optional[str] = None
    content: Optional[str] = None
    updated_at: datetime = Field(default_factory=utc_now)
    children: Optional[List["ProjectFile"]] = None

class ProjectMetadata(BaseModel):
    id: str
    name: str
    description: str = ""
    category: str = "Web Application"
    target_output: str = "HTML/CSS/JavaScript"
    design_style: str = "Modern Developer Tool"
    color_scheme: str = "Slate & Indigo"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    status: str = "created"  # created, generating, ready, failed
    file_count: int = 0
    total_size_bytes: int = 0
    last_generation_at: Optional[datetime] = None
    generation_error: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

class ProjectCreateRequest(BaseModel):
    name: str
    description: str = ""
    category: str = "Web Application"
    target_output: str = "HTML/CSS/JavaScript"
    design_style: str = "Modern Developer Tool"
    color_scheme: str = "Slate & Indigo"
    prompt: Optional[str] = None

class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    design_style: Optional[str] = None
    color_scheme: Optional[str] = None
    tags: Optional[List[str]] = None

class ProjectDuplicateRequest(BaseModel):
    new_name: Optional[str] = None

class FileCreateRequest(BaseModel):
    path: str
    content: str = ""

class FileUpdateRequest(BaseModel):
    content: str

class FileRenameRequest(BaseModel):
    new_path: str

