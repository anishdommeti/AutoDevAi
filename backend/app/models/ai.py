from datetime import datetime, timezone
from typing import List, Optional, Any
from pydantic import BaseModel, Field

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class ChatMessage(BaseModel):
    id: str
    role: str  # user, assistant, system
    content: str
    timestamp: datetime = Field(default_factory=utc_now)
    target_file: Optional[str] = None
    diff: Optional[str] = None

class FilePatch(BaseModel):
    path: str
    original_content: Optional[str] = None
    updated_content: str
    explanation: str
    diff: Optional[str] = None

class AIChatRequest(BaseModel):
    project_id: Optional[str] = None
    message: str
    active_file: Optional[str] = None
    active_file_content: Optional[str] = None
    history: List[ChatMessage] = Field(default_factory=list)

class AIChatResponse(BaseModel):
    reply: str
    proposed_changes: List[FilePatch] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)

class ApplyPatchRequest(BaseModel):
    project_id: str
    patches: List[FilePatch]

class CodeExplainRequest(BaseModel):
    project_id: str
    file_path: str
    code_snippet: Optional[str] = None

class CodeExplainResponse(BaseModel):
    summary: str
    key_components: List[str]
    best_practices: List[str]
    suggestions: List[str]

