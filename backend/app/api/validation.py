from fastapi import APIRouter
from app.models.validation import ValidationReport
from app.services.validator import CodeValidator

router = APIRouter(prefix="/projects/{project_id}/validation", tags=["Validation"])

@router.get("", response_model=ValidationReport)
@router.post("", response_model=ValidationReport)
def run_validation(project_id: str):
    return CodeValidator.validate_project(project_id)

