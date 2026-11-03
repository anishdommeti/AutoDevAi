import pytest
from app.models.project import ProjectCreateRequest
from app.services.storage import StorageService
from app.services.validator import CodeValidator

def test_code_validator():
    req = ProjectCreateRequest(name="Validation Test App")
    project = StorageService.create_project(req)

    # Write valid HTML referencing existing CSS and JS
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Valid Title</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <h1>Hello World</h1>
    <script src="js/main.js"></script>
</body>
</html>"""
    css = "body { color: red; } /* comment */"
    js = "function test() { console.log('test'); } test();"

    StorageService.write_file(project.id, "index.html", html)
    StorageService.write_file(project.id, "css/style.css", css)
    StorageService.write_file(project.id, "js/main.js", js)

    report = CodeValidator.validate_project(project.id)
    assert report.is_valid is True
    assert report.failed == 0
    assert report.passed > 0

def test_validator_detects_broken_references_and_syntax():
    req = ProjectCreateRequest(name="Broken Project")
    project = StorageService.create_project(req)

    # HTML referencing non-existent files
    broken_html = """<!DOCTYPE html>
<html>
<head><title>Broken</title><link rel="stylesheet" href="missing.css"></head>
<body><script src="missing.js"></script></body>
</html>"""
    # Broken CSS with unclosed brace
    broken_css = "body { margin: 0;"
    # Broken JS with unbalanced parenthesis
    broken_js = "function bad() { if (true { console.log('error'); } }"

    StorageService.write_file(project.id, "index.html", broken_html)
    StorageService.write_file(project.id, "styles.css", broken_css)
    StorageService.write_file(project.id, "app.js", broken_js)

    report = CodeValidator.validate_project(project.id)
    assert report.is_valid is False
    assert report.failed >= 3

