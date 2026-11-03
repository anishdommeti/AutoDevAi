from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class GenerationRequest(BaseModel):
    name: Optional[str] = None
    prompt: str
    category: str = "Web Application"
    target_output: str = "HTML/CSS/JavaScript"
    design_style: str = "Modern Developer Tool"
    color_scheme: str = "Slate & Indigo"
    additional_instructions: Optional[str] = None

class GeneratedFile(BaseModel):
    path: str
    content: str
    description: Optional[str] = None

class PlannedFile(BaseModel):
    path: str
    purpose: str

class GenerationPlan(BaseModel):
    project_name: str
    summary: str
    architecture: str
    files: List[PlannedFile]
    design_system: Dict[str, Any] = Field(default_factory=dict)

class StageProgress(BaseModel):
    stage: str
    title: str
    status: str  # pending, running, completed, failed
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    details: Optional[str] = None

class GenerationStatusResponse(BaseModel):
    project_id: str
    status: str  # idle, running, completed, failed
    current_stage: str
    progress_pct: int
    stages: List[StageProgress] = Field(default_factory=list)
    logs: List[str] = Field(default_factory=list)
    error: Optional[str] = None
    created_files: List[str] = Field(default_factory=list)

