import pytest
from fastapi import HTTPException
from app.models.project import ProjectCreateRequest, ProjectUpdateRequest
from app.services.storage import StorageService, resolve_safe_path

def test_project_crud_and_stats():
    # 1. Create
    req = ProjectCreateRequest(
        name="Test Task Manager",
        description="A sample test app",
        category="Productivity",
        target_output="HTML/CSS/JavaScript"
    )
    project = StorageService.create_project(req)
    assert project.id is not None
    assert project.name == "Test Task Manager"
    assert project.file_count == 0

    # 2. Write files
    StorageService.write_file(project.id, "index.html", "<!DOCTYPE html><html><body>Test</body></html>")
    StorageService.write_file(project.id, "css/styles.css", "body { margin: 0; }")
    
    # 3. Read files
    content = StorageService.read_file(project.id, "index.html")
    assert "<!DOCTYPE html>" in content
    
    # Check stats
    meta = StorageService.get_project(project.id)
    assert meta.file_count == 2
    assert meta.total_size_bytes > 0

    # 4. Tree structure
    tree = StorageService.get_file_tree(project.id)
    assert len(tree) >= 1
    paths = [f.path for f in tree]
    assert "index.html" in paths

    # 5. Update
    up_req = ProjectUpdateRequest(name="Renamed Task Manager", description="Updated description")
    updated = StorageService.update_project(project.id, up_req)
    assert updated.name == "Renamed Task Manager"

    # 6. Duplicate
    dup = StorageService.duplicate_project(project.id, "Duplicated Task App")
    assert dup.id != project.id
    assert dup.name == "Duplicated Task App"
    assert dup.file_count == 2

    # 7. ZIP Export
    zip_buf = StorageService.create_project_zip(project.id)
    assert zip_buf.getbuffer().nbytes > 0

    # 8. Delete
    StorageService.delete_project(dup.id)
    with pytest.raises(HTTPException):
        StorageService.get_project(dup.id)

def test_path_traversal_prevention():
    req = ProjectCreateRequest(name="Traversal Check")
    project = StorageService.create_project(req)

    # Attempt ../ traversal
    with pytest.raises(HTTPException) as exc:
        resolve_safe_path(project.id, "../outside.txt")
    assert exc.value.status_code == 400

    # Attempt nested traversal
    with pytest.raises(HTTPException) as exc:
        resolve_safe_path(project.id, "sub/../../outside.txt")
    assert exc.value.status_code == 400

    # Attempt null byte
    with pytest.raises(HTTPException) as exc:
        resolve_safe_path(project.id, "index.html\0malicious")
    assert exc.value.status_code == 400

