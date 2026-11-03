from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class ValidationCheck(BaseModel):
    name: str
    category: str  # syntax, references, structure, security
    status: str  # passed, failed, warning, not_applicable
    message: str
    file: Optional[str] = None
    line: Optional[int] = None

class ValidationReport(BaseModel):
    project_id: str
    timestamp: datetime = Field(default_factory=utc_now)
    total_checks: int = 0
    passed: int = 0
    failed: int = 0
    warnings: int = 0
    checks: List[ValidationCheck] = Field(default_factory=list)
    is_valid: bool = True

