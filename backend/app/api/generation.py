import asyncio
from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.models.generation import (
    GenerationRequest,
    GenerationStatusResponse,
)
from app.services.agent import AutonomousAgent
from app.services.storage import StorageService

router = APIRouter(prefix="/projects/{project_id}/generation", tags=["Generation"])

@router.post("/start", response_model=GenerationStatusResponse)
async def start_generation(
    project_id: str,
    req: GenerationRequest,
    background_tasks: BackgroundTasks
):
    # Ensure project exists
    StorageService.get_project(project_id)
    
    # Check if already generating
    current_status = AutonomousAgent.get_job_status(project_id)
    if current_status.status == "running":
        return current_status
        
    # Start generation in background
    background_tasks.add_task(AutonomousAgent.execute_generation, project_id, req)
    
    # Yield control briefly so job registers
    await asyncio.sleep(0.05)
    return AutonomousAgent.get_job_status(project_id)

@router.get("/status", response_model=GenerationStatusResponse)
def get_generation_status(project_id: str):
    return AutonomousAgent.get_job_status(project_id)

@router.post("/retry", response_model=GenerationStatusResponse)
async def retry_generation(
    project_id: str,
    background_tasks: BackgroundTasks
):
    meta = StorageService.get_project(project_id)
    req = GenerationRequest(
        name=meta.name,
        prompt=meta.description or f"Generate a complete modern {meta.category} application",
        category=meta.category,
        target_output=meta.target_output,
        design_style=meta.design_style,
        color_scheme=meta.color_scheme,
    )
    background_tasks.add_task(AutonomousAgent.execute_generation, project_id, req)
    await asyncio.sleep(0.05)
    return AutonomousAgent.get_job_status(project_id)

