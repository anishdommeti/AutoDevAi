import pytest
from app.models.project import ProjectCreateRequest
from app.models.generation import GenerationRequest
from app.services.storage import StorageService
from app.services.agent import AutonomousAgent

@pytest.mark.asyncio
async def test_autonomous_agent_generation_pipeline():
    req = ProjectCreateRequest(
        name="Agent Flow Test",
        description="Autonomous generation test app",
        category="Productivity",
    )
    project = StorageService.create_project(req)

    gen_req = GenerationRequest(
        name="Agent Flow Test",
        prompt="Create an interactive note taking application with tags and search",
        category="Productivity",
        design_style="Modern Developer Tool",
        color_scheme="Slate & Indigo"
    )

    # Run the full agent pipeline
    await AutonomousAgent.execute_generation(project.id, gen_req)

    status = AutonomousAgent.get_job_status(project.id)
    assert status.status == "completed"
    assert status.progress_pct == 100
    assert len(status.created_files) >= 3

    # Verify files exist on disk
    tree = StorageService.get_file_tree(project.id)
    paths = [f.path for f in tree]
    assert "index.html" in paths
    assert "README.md" in paths

    # Verify updated metadata
    meta = StorageService.get_project(project.id)
    assert meta.status == "ready"
    assert meta.file_count >= 3

