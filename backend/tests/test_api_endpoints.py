import io
import zipfile
import pytest

def test_api_health(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "gemini_configured" in data

def test_api_settings_and_metrics(client):
    res = client.get("/api/v1/settings")
    assert res.status_code == 200
    data = res.json()
    assert data["app_name"] == "AutoDevAI"

    metrics_res = client.get("/api/v1/dashboard/metrics")
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert "total_projects" in metrics
    assert "total_files" in metrics

def test_api_projects_and_files_crud(client):
    # 1. Create project
    create_payload = {
        "name": "API Test Project",
        "description": "Created via test",
        "category": "Web Application"
    }
    create_res = client.post("/api/v1/projects", json=create_payload)
    assert create_res.status_code == 201
    project = create_res.json()
    project_id = project["id"]

    # 2. Get project
    get_res = client.get(f"/api/v1/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "API Test Project"

    # 3. Create file
    file_payload = {
        "path": "index.html",
        "content": "<!DOCTYPE html><html><body>Test</body></html>"
    }
    file_res = client.post(f"/api/v1/projects/{project_id}/files", json=file_payload)
    assert file_res.status_code == 201

    # 4. Read file content
    content_res = client.get(f"/api/v1/projects/{project_id}/files/content?path=index.html")
    assert content_res.status_code == 200
    assert "Test" in content_res.json()["content"]

    # 5. Export project ZIP
    export_res = client.get(f"/api/v1/projects/{project_id}/export")
    assert export_res.status_code == 200
    assert export_res.headers["content-type"] == "application/zip"
    
    # Verify zip content
    with zipfile.ZipFile(io.BytesIO(export_res.content)) as zf:
        namelist = zf.namelist()
        assert "index.html" in namelist

    # 6. Delete project
    del_res = client.delete(f"/api/v1/projects/{project_id}")
    assert del_res.status_code == 200

