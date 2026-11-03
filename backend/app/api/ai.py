from fastapi import APIRouter, HTTPException
from app.models.ai import (
    AIChatRequest,
    AIChatResponse,
    ApplyPatchRequest,
    CodeExplainRequest,
    CodeExplainResponse,
)
from app.services.gemini import GeminiService
from app.services.storage import StorageService

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/chat", response_model=AIChatResponse)
def chat_with_assistant(req: AIChatRequest):
    project_context = {}
    if req.project_id:
        try:
            meta = StorageService.get_project(req.project_id)
            tree = StorageService.get_file_tree(req.project_id)
            file_paths = []
            def collect_paths(nodes):
                for n in nodes:
                    if not n.is_dir:
                        file_paths.append(n.path)
                    elif n.children:
                        collect_paths(n.children)
            collect_paths(tree)
            project_context = {
                "name": meta.name,
                "description": meta.description,
                "category": meta.category,
                "files": file_paths,
            }
        except Exception:
            pass

    return GeminiService.chat_assistant(
        message=req.message,
        project_context=project_context,
        active_file=req.active_file,
        active_file_content=req.active_file_content,
        history=req.history
    )

@router.post("/explain", response_model=CodeExplainResponse)
def explain_code(req: CodeExplainRequest):
    content = StorageService.read_file(req.project_id, req.file_path)
    return GeminiService.explain_code(
        file_path=req.file_path,
        content=content,
        snippet=req.code_snippet
    )

@router.post("/apply-patch")
def apply_patch(req: ApplyPatchRequest):
    applied = []
    for patch in req.patches:
        StorageService.write_file(req.project_id, patch.path, patch.updated_content)
        applied.append(patch.path)
    return {"success": True, "applied_files": applied}

