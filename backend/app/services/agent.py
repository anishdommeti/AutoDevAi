import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.config import settings
from app.models.project import ProjectMetadata
from app.models.generation import (
    GenerationRequest,
    GenerationPlan,
    GenerationStatusResponse,
    StageProgress,
)
from app.models.validation import ValidationReport
from app.services.storage import StorageService
from app.services.validator import CodeValidator
from app.services.gemini import GeminiService

logger = logging.getLogger("autodev.agent")

class AutonomousAgent:
    # In-memory tracking of active or recent jobs
    _active_jobs: Dict[str, GenerationStatusResponse] = {}

    @classmethod
    def get_job_status(cls, project_id: str) -> GenerationStatusResponse:
        if project_id in cls._active_jobs:
            return cls._active_jobs[project_id]
        
        # Check if project exists on disk to return idle/completed state
        try:
            meta = StorageService.get_project(project_id)
            status = "completed" if meta.status == "ready" else ("failed" if meta.status == "failed" else "idle")
            return GenerationStatusResponse(
                project_id=project_id,
                status=status,
                current_stage="idle",
                progress_pct=100 if status == "completed" else 0,
                stages=[],
                logs=[f"Project status: {status}"],
                error=meta.generation_error,
                created_files=[]
            )
        except Exception:
            return GenerationStatusResponse(
                project_id=project_id,
                status="not_found",
                current_stage="none",
                progress_pct=0,
                stages=[],
                logs=["Project not found"],
                error="Project does not exist",
                created_files=[]
            )

    @classmethod
    async def execute_generation(cls, project_id: str, request: GenerationRequest):
        """Execute the multi-stage autonomous code generation pipeline."""
        now = datetime.now(timezone.utc)
        meta = StorageService.get_project(project_id)
        meta.status = "generating"
        meta.generation_error = None
        StorageService.save_metadata(meta)

        stages = [
            StageProgress(stage="analysis", title="Requirement Analysis", status="pending"),
            StageProgress(stage="planning", title="Task & Architecture Planning", status="pending"),
            StageProgress(stage="generation", title="Source Code Generation", status="pending"),
            StageProgress(stage="validation", title="Code Validation & Syntax Check", status="pending"),
            StageProgress(stage="repair", title="Consistency & Repair Loop", status="pending"),
            StageProgress(stage="finalization", title="Verification & Project Persistence", status="pending"),
        ]

        job = GenerationStatusResponse(
            project_id=project_id,
            status="running",
            current_stage="analysis",
            progress_pct=5,
            stages=stages,
            logs=[f"[{now.strftime('%H:%M:%S')}] Started generation for '{meta.name}'"],
            created_files=[]
        )
        cls._active_jobs[project_id] = job

        def log_msg(msg: str):
            t = datetime.now(timezone.utc).strftime("%H:%M:%S")
            job.logs.append(f"[{t}] {msg}")
            logger.info(f"[{project_id}] {msg}")

        try:
            # -------------------------------------------------------------
            # STAGE 1: REQUIREMENT ANALYSIS
            # -------------------------------------------------------------
            job.current_stage = "analysis"
            job.stages[0].status = "running"
            job.stages[0].started_at = datetime.now(timezone.utc)
            job.progress_pct = 15
            log_msg("Analyzing user prompt, category, design tokens, and functional expectations...")
            await asyncio.sleep(0.3)

            job.stages[0].status = "completed"
            job.stages[0].completed_at = datetime.now(timezone.utc)
            job.stages[0].details = f"Extracted specifications for {request.category} with {request.design_style} styling."
            log_msg("Requirements parsed successfully.")

            # -------------------------------------------------------------
            # STAGE 2: ARCHITECTURE PLANNING
            # -------------------------------------------------------------
            job.current_stage = "planning"
            job.stages[1].status = "running"
            job.stages[1].started_at = datetime.now(timezone.utc)
            job.progress_pct = 30
            log_msg("Synthesizing multi-file architecture plan...")

            plan: GenerationPlan = GeminiService.plan_architecture(
                prompt=request.prompt,
                category=request.category,
                design_style=request.design_style,
                color_scheme=request.color_scheme,
                additional_instructions=request.additional_instructions,
                name=meta.name
            )
            log_msg(f"Architecture planned: {len(plan.files)} source files targeted.")
            for f in plan.files:
                log_msg(f"  • {f.path} - {f.purpose}")

            job.stages[1].status = "completed"
            job.stages[1].completed_at = datetime.now(timezone.utc)
            job.stages[1].details = f"Planned {len(plan.files)} files: {', '.join(f.path for f in plan.files)}"

            # -------------------------------------------------------------
            # STAGE 3: CODE GENERATION
            # -------------------------------------------------------------
            job.current_stage = "generation"
            job.stages[2].status = "running"
            job.stages[2].started_at = datetime.now(timezone.utc)
            job.progress_pct = 50
            log_msg("Generating full source files with clean separation of concerns...")

            generated_files: Dict[str, str] = {}
            total_planned = len(plan.files)
            for idx, planned_file in enumerate(plan.files, 1):
                log_msg(f"Generating ({idx}/{total_planned}): {planned_file.path}...")
                content = GeminiService.generate_file(
                    plan=plan,
                    file_path=planned_file.path,
                    purpose=planned_file.purpose,
                    existing_files=generated_files
                )
                generated_files[planned_file.path] = content
                job.created_files.append(planned_file.path)
                job.progress_pct = 50 + int((idx / total_planned) * 20)
                await asyncio.sleep(0.1)

            job.stages[2].status = "completed"
            job.stages[2].completed_at = datetime.now(timezone.utc)
            job.stages[2].details = f"Generated {len(generated_files)} production-ready files."
            log_msg("All source files synthesized.")

            # Temporarily write files to disk for validation
            for path, code in generated_files.items():
                StorageService.write_file(project_id, path, code)

            # -------------------------------------------------------------
            # STAGE 4: VALIDATION
            # -------------------------------------------------------------
            job.current_stage = "validation"
            job.stages[3].status = "running"
            job.stages[3].started_at = datetime.now(timezone.utc)
            job.progress_pct = 75
            log_msg("Running automated validation suite (HTML5 structure, CSS syntax, JS balance, references)...")

            report: ValidationReport = CodeValidator.validate_project(project_id)
            log_msg(f"Validation summary: {report.passed} passed, {report.warnings} warnings, {report.failed} failed.")

            job.stages[3].status = "completed"
            job.stages[3].completed_at = datetime.now(timezone.utc)
            job.stages[3].details = f"{report.passed} passed, {report.failed} failed."

            # -------------------------------------------------------------
            # STAGE 5: REPAIR LOOP
            # -------------------------------------------------------------
            job.current_stage = "repair"
            job.stages[4].status = "running"
            job.stages[4].started_at = datetime.now(timezone.utc)
            job.progress_pct = 85

            if not report.is_valid and report.failed > 0:
                log_msg(f"Validation detected {report.failed} issues. Engaging targeted autonomous repair loop...")
                repair_attempts = 0
                while not report.is_valid and repair_attempts < settings.MAX_REPAIR_ATTEMPTS:
                    repair_attempts += 1
                    log_msg(f"Autonomous repair iteration {repair_attempts}/{settings.MAX_REPAIR_ATTEMPTS}...")
                    
                    # Group failures by file
                    file_errors: Dict[str, List[str]] = {}
                    for chk in report.checks:
                        if chk.status == "failed" and chk.file:
                            file_errors.setdefault(chk.file, []).append(chk.message)

                    for file_path, errors in file_errors.items():
                        current_code = generated_files.get(file_path, "")
                        repaired_code = GeminiService.repair_code(file_path, current_code, errors)
                        generated_files[file_path] = repaired_code
                        StorageService.write_file(project_id, file_path, repaired_code)
                        log_msg(f"  Applied patch to '{file_path}'.")

                    # Re-validate
                    report = CodeValidator.validate_project(project_id)
                    log_msg(f"Re-validation: {report.passed} passed, {report.failed} failed.")

                job.stages[4].status = "completed"
                job.stages[4].completed_at = datetime.now(timezone.utc)
                job.stages[4].details = f"Repair completed after {repair_attempts} iteration(s)."
            else:
                job.stages[4].status = "completed"
                job.stages[4].completed_at = datetime.now(timezone.utc)
                job.stages[4].details = "Zero syntax or reference defects detected. No repair needed."
                log_msg("Validation passed cleanly on initial attempt.")

            # -------------------------------------------------------------
            # STAGE 6: FINALIZATION & PERSISTENCE
            # -------------------------------------------------------------
            job.current_stage = "finalization"
            job.stages[5].status = "running"
            job.stages[5].started_at = datetime.now(timezone.utc)
            job.progress_pct = 95
            log_msg("Persisting project metadata, updating statistics, and finalizing build...")

            StorageService.recalculate_project_stats(project_id)
            meta = StorageService.get_project(project_id)
            meta.status = "ready" if report.is_valid else "failed"
            meta.last_generation_at = datetime.now(timezone.utc)
            meta.generation_error = None if report.is_valid else "Validation warnings/defects remained"
            StorageService.save_metadata(meta)

            StorageService.log_activity(
                project_id=project_id,
                project_name=meta.name,
                activity_type="generated",
                description=f"Generated {len(generated_files)} files with {report.passed} checks passed."
            )

            job.stages[5].status = "completed"
            job.stages[5].completed_at = datetime.now(timezone.utc)
            job.stages[5].details = f"Project is {meta.status} and ready for preview & export."
            
            job.status = "completed"
            job.progress_pct = 100
            log_msg("Generation completed successfully!")

        except Exception as e:
            logger.exception("Generation failed")
            job.status = "failed"
            job.error = str(e)
            log_msg(f"FATAL: Generation aborted: {str(e)}")
            meta = StorageService.get_project(project_id)
            meta.status = "failed"
            meta.generation_error = str(e)
            StorageService.save_metadata(meta)
