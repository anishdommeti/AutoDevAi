from datetime import datetime, timezone
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class SettingsResponse(BaseModel):
    app_name: str
    version: str
    gemini_configured: bool
    gemini_model: str
    data_dir: str
    total_projects: int
    total_files: int
    total_size_mb: float

class ConnectionTestResponse(BaseModel):
    success: bool
    model: str
    latency_ms: Optional[float] = None
    message: str
    error_details: Optional[str] = None

class ActivityItem(BaseModel):
    id: str
    project_id: str
    project_name: str
    activity_type: str  # created, generated, edited, validated, repaired, exported, deleted
    description: str
    timestamp: datetime = Field(default_factory=utc_now)

class DashboardMetrics(BaseModel):
    total_projects: int
    ready_projects: int
    generating_projects: int
    failed_projects: int
    total_files: int
    total_lines_of_code: int
    recent_activity: List[ActivityItem] = Field(default_factory=list)
    category_distribution: Dict[str, int] = Field(default_factory=dict)

