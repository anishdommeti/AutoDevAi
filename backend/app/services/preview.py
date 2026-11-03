import mimetypes
from pathlib import Path
from fastapi import HTTPException
from fastapi.responses import Response, FileResponse
from app.config import settings
from app.services.storage import resolve_safe_path

class PreviewService:
    @staticmethod
    def serve_preview_file(project_id: str, file_path: str = "") -> Response:
        """Serve generated project files with security headers for sandboxed preview."""
        target_file = file_path if file_path and file_path != "/" else "index.html"
        full_path = resolve_safe_path(project_id, target_file)
        
        if not full_path.exists() or not full_path.is_file():
            # If requesting index.html but not found, provide a friendly placeholder
            if target_file == "index.html":
                html_fallback = """<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
    .card { text-align: center; padding: 2rem; border-radius: 12px; background: #1e293b; border: 1px solid #334155; }
    h2 { margin-top: 0; color: #60a5fa; }
  </style>
</head>
<body>
  <div class="card">
    <h2>No index.html Found</h2>
    <p>This project has not generated an <code>index.html</code> yet.</p>
  </div>
</body>
</html>"""
                return Response(content=html_fallback, media_type="text/html")
            raise HTTPException(status_code=404, detail=f"File not found: {target_file}")

        content_type, _ = mimetypes.guess_type(str(full_path))
        if not content_type:
            if full_path.suffix == ".js":
                content_type = "application/javascript"
            elif full_path.suffix == ".css":
                content_type = "text/css"
            elif full_path.suffix in [".html", ".htm"]:
                content_type = "text/html"
            else:
                content_type = "text/plain"

        try:
            with open(full_path, "rb") as f:
                data = f.read()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading file: {e}")

        response = Response(content=data, media_type=content_type)
        
        # Enforce sandbox headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self' 'unsafe-inline' https: data:; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; "
            "style-src 'self' 'unsafe-inline' https:; "
            "img-src 'self' data: https:; "
            "font-src 'self' https: data:; "
            "connect-src 'self' https: data:;"
        )
        # Allow iframe embedding
        response.headers["X-Frame-Options"] = "ALLOWALL"
        return response

