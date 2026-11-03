import pytest

def test_api_directory_traversal_blocked(client):
    # Create a project
    create_res = client.post("/api/v1/projects", json={"name": "Security Check Project"})
    project_id = create_res.json()["id"]

    # Traversal in read
    res1 = client.get(f"/api/v1/projects/{project_id}/files/content?path=../../etc/passwd")
    assert res1.status_code == 400

    # Traversal in write
    res2 = client.post(
        f"/api/v1/projects/{project_id}/files",
        json={"path": "../../../sneaky.txt", "content": "malicious"}
    )
    assert res2.status_code == 400

    # Null byte injection
    res3 = client.get(f"/api/v1/projects/{project_id}/files/content?path=index.html%00.txt")
    assert res3.status_code == 400

def test_secret_redaction_in_errors(client):
    # Attempting to call non-existent endpoints should return clean errors
    res = client.get("/api/v1/projects/invalid-uuid-12345")
    assert res.status_code == 404
    data = res.json()
    assert "detail" in data
    # Ensure no internal path leakage
    assert "AIza" not in str(data)

