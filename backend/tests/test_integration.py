import io
import time
import zipfile
import pytest
from app.models.project import ProjectCreateRequest
from app.models.generation import GenerationRequest
from app.services.storage import StorageService
from app.services.agent import AutonomousAgent
from app.services.validator import CodeValidator
from app.services.gemini import GeminiService

@pytest.mark.asyncio
async def test_complete_autonomous_lifecycle():
    # 1. Dashboard initial metrics
    initial_metrics = StorageService.get_dashboard_metrics()
    initial_project_count = initial_metrics.total_projects

    # 2. Create project
    create_req = ProjectCreateRequest(
        name="Integration Habit App",
        description="Daily habit streak and progress tracker",
        category="Productivity",
        target_output="HTML/CSS/JavaScript",
        design_style="Modern Developer Tool",
        color_scheme="Slate & Indigo",
    )
    project = StorageService.create_project(create_req)
    assert project.id is not None
    assert project.status == "created"

    # 3. Autonomous multi-stage generation
    gen_req = GenerationRequest(
        name=project.name,
        prompt="Build a full habit tracker with streaks, checkboxes, search, and local storage",
        category=project.category,
        design_style=project.design_style,
        color_scheme=project.color_scheme,
    )
    await AutonomousAgent.execute_generation(project.id, gen_req)

    # 4. Check generation status
    status = AutonomousAgent.get_job_status(project.id)
    assert status.status == "completed"
    assert status.progress_pct == 100
    assert len(status.created_files) >= 3

    # 5. Verify file persistence and structure
    tree = StorageService.get_file_tree(project.id)
    file_paths = [f.path for f in tree]
    assert "index.html" in file_paths
    assert "README.md" in file_paths

    # Read and verify content
    html_content = StorageService.read_file(project.id, "index.html")
    assert "<!DOCTYPE html>" in html_content
    assert "Integration Habit App" in html_content

    # 6. Verify automated validation
    val_report = CodeValidator.validate_project(project.id)
    assert val_report.is_valid is True
    assert val_report.failed == 0
    assert val_report.passed > 0

    # 7. Edit file in IDE workspace and verify persistence
    edited_html = html_content.replace("⚡", "🚀")
    StorageService.write_file(project.id, "index.html", edited_html)
    re_read_html = StorageService.read_file(project.id, "index.html")
    assert "🚀" in re_read_html

    # 8. Test AI Assistant contextual chat
    chat_res = GeminiService.chat_assistant(
        message="Add a daily reminder notification feature to the tracker",
        project_context={"name": project.name, "files": file_paths},
        active_file="index.html",
        active_file_content=re_read_html
    )
    assert chat_res.reply is not None
    assert len(chat_res.reply) > 10

    # 9. Test ZIP export
    zip_buf = StorageService.create_project_zip(project.id)
    with zipfile.ZipFile(zip_buf) as zf:
        names = zf.namelist()
        assert "index.html" in names
        assert "README.md" in names
        # Verify no temporary or corrupted files in zip
        for name in names:
            assert not name.endswith(".tmp")

    # 10. Test Duplicate
    dup_meta = StorageService.duplicate_project(project.id, "Integration Habit App Copy")
    assert dup_meta.id != project.id
    assert dup_meta.name == "Integration Habit App Copy"
    assert dup_meta.file_count >= 3

    # 11. Test Delete
    StorageService.delete_project(dup_meta.id)
    with pytest.raises(Exception):
        StorageService.get_project(dup_meta.id)

    # 12. Verify Dashboard metrics updated accurately
    final_metrics = StorageService.get_dashboard_metrics()
    assert final_metrics.total_projects == initial_project_count + 1
    assert final_metrics.ready_projects >= 1

