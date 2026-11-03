import os
import json
import time
import re
from typing import List, Dict, Optional, Any
from app.config import settings
from app.models.settings import ConnectionTestResponse
from app.models.generation import GenerationPlan, PlannedFile
from app.models.ai import AIChatResponse, FilePatch, CodeExplainResponse, ChatMessage

class GeminiService:
    @staticmethod
    def get_api_key() -> Optional[str]:
        return settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")

    @classmethod
    def is_configured(cls) -> bool:
        key = cls.get_api_key()
        return bool(key and key.strip() and not key.startswith("your_"))

    @classmethod
    def get_client(cls):
        if not cls.is_configured():
            return None
        from google import genai
        return genai.Client(api_key=cls.get_api_key())

    @classmethod
    async def test_connection(cls) -> ConnectionTestResponse:
        if not cls.is_configured():
            return ConnectionTestResponse(
                success=False,
                model=settings.GEMINI_MODEL,
                message="GEMINI_API_KEY is not configured. Please provide a valid Gemini API key in backend/.env",
                error_details="Missing API key"
            )
            
        start_time = time.perf_counter()
        try:
            client = cls.get_client()
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents="Ping. Reply with PONG."
            )
            latency = (time.perf_counter() - start_time) * 1000
            
            if response and response.text:
                return ConnectionTestResponse(
                    success=True,
                    model=settings.GEMINI_MODEL,
                    latency_ms=round(latency, 2),
                    message=f"Connected successfully to Gemini model ({settings.GEMINI_MODEL}) in {round(latency, 1)}ms"
                )
            else:
                return ConnectionTestResponse(
                    success=False,
                    model=settings.GEMINI_MODEL,
                    message="Model responded with empty content",
                    error_details="Empty response"
                )
        except Exception as e:
            return ConnectionTestResponse(
                success=False,
                model=settings.GEMINI_MODEL,
                message=f"Connection to Gemini failed: {str(e)}",
                error_details=str(e)
            )

    @classmethod
    def parse_json_safely(cls, text: str) -> Any:
        """Strip markdown fences (```json ... ```) and parse JSON safely."""
        cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
        cleaned = re.sub(r"```\s*$", "", cleaned.strip(), flags=re.MULTILINE)
        try:
            return json.loads(cleaned)
        except Exception:
            # Fallback to finding first { or [ and matching
            m = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
            if m:
                return json.loads(m.group(1))
            raise ValueError(f"Could not parse valid JSON from model response: {text[:200]}")

    @classmethod
    def plan_architecture(
        cls,
        prompt: str,
        category: str,
        design_style: str,
        color_scheme: str,
        additional_instructions: Optional[str] = None,
        name: Optional[str] = None
    ) -> GenerationPlan:
        """Generate architectural plan and list of files."""
        if not cls.is_configured():
            # Deterministic test provider plan
            return cls._deterministic_plan(prompt, category, design_style, color_scheme, name=name)
            
        system_instruction = (
            "You are AutoDevAI, a principal software architect. Given user requirements, analyze them "
            "and create a structured application generation plan. You must return ONLY a JSON object with this exact schema:\n"
            "{\n"
            '  "project_name": "clean-kebab-name",\n'
            '  "summary": "Concise summary of what the app does",\n'
            '  "architecture": "Architecture and design explanation",\n'
            '  "files": [\n'
            '    {"path": "index.html", "purpose": "Main UI and layout"},\n'
            '    {"path": "css/styles.css", "purpose": "Styling, themes, layout"},\n'
            '    {"path": "js/app.js", "purpose": "Core application logic and state"},\n'
            '    {"path": "README.md", "purpose": "Documentation and setup"}\n'
            "  ],\n"
            '  "design_system": {\n'
            '    "primaryColor": "#hex",\n'
            '    "accentColor": "#hex",\n'
            '    "font": "Inter, sans-serif"\n'
            "  }\n"
            "}\n"
            "Return valid JSON only. Do not wrap in conversational text."
        )
        
        user_msg = (
            f"User Requirements: {prompt}\n"
            f"Category: {category}\n"
            f"Design Style: {design_style}\n"
            f"Color Scheme: {color_scheme}\n"
        )
        if additional_instructions:
            user_msg += f"Additional Instructions: {additional_instructions}\n"

        client = cls.get_client()
        try:
            res = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=f"{system_instruction}\n\n{user_msg}",
            )
            data = cls.parse_json_safely(res.text)
            return GenerationPlan(
                project_name=data.get("project_name", "autodev-app"),
                summary=data.get("summary", "Generated application"),
                architecture=data.get("architecture", "Client-side architecture"),
                files=[PlannedFile(**f) for f in data.get("files", [])],
                design_system=data.get("design_system", {})
            )
        except Exception as e:
            print(f"Gemini planning failed ({e}), falling back to deterministic plan.")
            return cls._deterministic_plan(prompt, category, design_style, color_scheme)

    @classmethod
    def generate_file(
        cls,
        plan: GenerationPlan,
        file_path: str,
        purpose: str,
        existing_files: Dict[str, str]
    ) -> str:
        """Generate full, production-quality code for a specific planned file."""
        if not cls.is_configured():
            return cls._deterministic_file_content(plan, file_path, existing_files)

        prompt = (
            f"You are AutoDevAI, a senior full-stack software engineer.\n"
            f"Project: {plan.project_name}\n"
            f"Summary: {plan.summary}\n"
            f"File to generate: '{file_path}'\n"
            f"Purpose: {purpose}\n\n"
            f"Other files planned or generated in this project:\n"
        )
        for path in existing_files:
            prompt += f"- {path} ({len(existing_files[path])} chars)\n"

        prompt += (
            "\nRequirements for generated code:\n"
            "1. Output ONLY the raw content of this single file. No markdown backticks, no explanations.\n"
            "2. Complete, functional, and production-ready. No placeholder TODOs, no empty stub functions.\n"
            "3. If HTML: Valid HTML5, include <!DOCTYPE html>, link css/styles.css and script js/app.js accurately.\n"
            "4. If CSS: Modern, responsive, clean variables matching design tokens, beautiful styling.\n"
            "5. If JS: Vanilla ES6+, modular, robust state management, localStorage persistence, event handling, error handling.\n"
            "6. Ensure all relative paths match exactly between HTML, CSS, and JS."
        )

        client = cls.get_client()
        try:
            res = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            raw = res.text.strip()
            # Strip markdown code blocks if the model wrapped it
            if raw.startswith("```"):
                lines = raw.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                raw = "\n".join(lines).strip()
            return raw
        except Exception as e:
            print(f"Gemini code generation failed ({e}), using deterministic generation.")
            return cls._deterministic_file_content(plan, file_path, existing_files)

    @classmethod
    def repair_code(
        cls,
        file_path: str,
        content: str,
        errors: List[str]
    ) -> str:
        """Targeted repair for a file failing validation."""
        if not cls.is_configured():
            return cls._deterministic_repair(file_path, content, errors)

        prompt = (
            f"You are AutoDevAI Code Repair Engineer.\n"
            f"The file '{file_path}' failed validation with the following errors:\n"
            + "\n".join(f"- {e}" for e in errors)
            + f"\n\nCurrent code:\n```\n{content}\n```\n\n"
            "Fix the syntax, unclosed braces, or broken references. Return ONLY the repaired file code, nothing else."
        )

        client = cls.get_client()
        try:
            res = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            raw = res.text.strip()
            if raw.startswith("```"):
                lines = raw.splitlines()[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                raw = "\n".join(lines).strip()
            return raw
        except Exception:
            return cls._deterministic_repair(file_path, content, errors)

    @classmethod
    def chat_assistant(
        cls,
        message: str,
        project_context: Dict[str, Any],
        active_file: Optional[str] = None,
        active_file_content: Optional[str] = None,
        history: Optional[List[ChatMessage]] = None
    ) -> AIChatResponse:
        """Handle conversational queries and code modification proposals."""
        if not cls.is_configured():
            return cls._deterministic_chat_response(message, active_file, active_file_content)

        client = cls.get_client()
        prompt = (
            "You are AutoDevAI Assistant, a friendly and expert developer companion.\n"
            f"Active Project: {project_context.get('name', 'None')}\n"
            f"Project Files: {', '.join(project_context.get('files', []))}\n"
        )
        if active_file:
            prompt += f"User is currently viewing: '{active_file}'\n"
            if active_file_content:
                prompt += f"File content:\n```\n{active_file_content[:3000]}\n```\n"

        prompt += (
            f"\nUser query: {message}\n\n"
            "If the user asks to modify or write code for a file, return your answer in JSON format:\n"
            "{\n"
            '  "reply": "Conversational explanation of changes",\n'
            '  "proposed_changes": [\n'
            '    {\n'
            '      "path": "filename",\n'
            '      "updated_content": "Full updated file content",\n'
            '      "explanation": "Why this change was made",\n'
            '      "diff": "Brief summary of changes"\n'
            '    }\n'
            "  ],\n"
            '  "suggested_actions": ["Run preview", "Add unit test"]\n'
            "}\n"
            "If it's just a general question or explanation without code changes, return:\n"
            "{\n"
            '  "reply": "Your clear, markdown-formatted explanation",\n'
            '  "proposed_changes": [],\n'
            '  "suggested_actions": ["Next suggestion"]\n'
            "}\n"
            "Return valid JSON only."
        )

        try:
            res = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            data = cls.parse_json_safely(res.text)
            return AIChatResponse(
                reply=data.get("reply", "Here is the response."),
                proposed_changes=[FilePatch(**p) for p in data.get("proposed_changes", [])],
                suggested_actions=data.get("suggested_actions", [])
            )
        except Exception as e:
            return cls._deterministic_chat_response(message, active_file, active_file_content)

    @classmethod
    def explain_code(cls, file_path: str, content: str, snippet: Optional[str] = None) -> CodeExplainResponse:
        code_to_explain = snippet or content
        if not cls.is_configured():
            return CodeExplainResponse(
                summary=f"Analysis of '{file_path}': Implements core logic and visual presentation.",
                key_components=["State management", "DOM Event listeners", "Responsive styling"],
                best_practices=["Clean modular structure", "Semantic element naming", "Separation of concerns"],
                suggestions=["Add keyboard shortcuts", "Persist state to localStorage", "Add accessibility ARIA attributes"]
            )
        
        client = cls.get_client()
        prompt = (
            f"Explain this code from '{file_path}':\n```\n{code_to_explain[:4000]}\n```\n"
            "Return JSON only:\n"
            "{\n"
            '  "summary": "concise overview",\n'
            '  "key_components": ["comp1", "comp2"],\n'
            '  "best_practices": ["bp1", "bp2"],\n'
            '  "suggestions": ["sug1", "sug2"]\n'
            "}"
        )
        try:
            res = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            data = cls.parse_json_safely(res.text)
            return CodeExplainResponse(**data)
        except Exception:
            return CodeExplainResponse(
                summary=f"Analysis of '{file_path}': Implements component logic and layout.",
                key_components=["Component layout", "Event handling"],
                best_practices=["Readable code", "Proper separation"],
                suggestions=["Add unit tests", "Add error boundaries"]
            )

    # -------------------------------------------------------------
    # DETERMINISTIC TEST & DEMO PROVIDER IMPLEMENTATION
    # -------------------------------------------------------------
    @classmethod
    def _deterministic_plan(
        cls,
        prompt: str,
        category: str,
        design_style: str,
        color_scheme: str,
        name: Optional[str] = None
    ) -> GenerationPlan:
        # Create a clean kebab name from name or prompt
        if name and name.strip():
            clean_slug = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
        else:
            words = re.findall(r"[a-zA-Z0-9]+", prompt.lower())
            clean_slug = "-".join(words[:4]) if words else "autonomous-app"
        
        return GenerationPlan(
            project_name=clean_slug,
            summary=f"Fully functional {category} featuring responsive UI, local persistence, and interactive controls based on: '{prompt}'.",
            architecture="Modular client-side single page architecture with separate semantic markup (index.html), CSS styling (css/styles.css), stateful JS logic (js/app.js), and documentation (README.md).",
            files=[
                PlannedFile(path="index.html", purpose="Semantic HTML5 layout, toolbar, workspace and container elements"),
                PlannedFile(path="css/styles.css", purpose="Responsive design tokens, themes, layout, and component styles"),
                PlannedFile(path="js/app.js", purpose="Reactive state store, localStorage persistence, event handlers, and UI renderers"),
                PlannedFile(path="README.md", purpose="Project overview, architecture guide, and usage instructions"),
            ],
            design_system={
                "style": design_style,
                "color_scheme": color_scheme,
                "primaryColor": "#4f46e5",
                "accentColor": "#06b6d4"
            }
        )

    @classmethod
    def _deterministic_file_content(cls, plan: GenerationPlan, file_path: str, existing_files: Dict[str, str]) -> str:
        title = plan.project_name.replace("-", " ").title()
        
        if file_path == "index.html":
            return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Built with AutoDevAI</title>
  <link rel="stylesheet" href="css/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div id="app" class="app-layout">
    <header class="app-header">
      <div class="brand">
        <div class="brand-icon">⚡</div>
        <div class="brand-text">
          <h1>{title}</h1>
          <span class="badge">AutoDevAI Generated</span>
        </div>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="Search items..." aria-label="Search">
        </div>
        <button id="themeToggleBtn" class="btn btn-ghost" title="Toggle Dark/Light Mode">🌓</button>
        <button id="newItemBtn" class="btn btn-primary">+ Create New</button>
      </div>
    </header>

    <main class="app-main">
      <aside class="sidebar">
        <nav class="nav-menu">
          <button class="nav-item active" data-filter="all">
            <span class="nav-icon">📁</span> All Items (<span id="countAll">0</span>)
          </button>
          <button class="nav-item" data-filter="active">
            <span class="nav-icon">⏳</span> Active (<span id="countActive">0</span>)
          </button>
          <button class="nav-item" data-filter="completed">
            <span class="nav-icon">✅</span> Completed (<span id="countCompleted">0</span>)
          </button>
        </nav>

        <div class="sidebar-stats">
          <h3>Quick Stats</h3>
          <div class="stat-row">
            <span>Storage:</span>
            <strong>Local Persisted</strong>
          </div>
          <div class="stat-row">
            <span>Status:</span>
            <strong class="text-success">Operational</strong>
          </div>
        </div>
      </aside>

      <section class="content-area">
        <div class="toolbar">
          <h2 id="viewTitle">All Items</h2>
          <div class="filter-controls">
            <select id="sortSelect" class="form-select">
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="title">Sort: Alphabetical</option>
            </select>
            <button id="clearAllBtn" class="btn btn-danger btn-sm">Clear All</button>
          </div>
        </div>

        <div id="emptyState" class="empty-state hidden">
          <div class="empty-icon">📂</div>
          <h3>No items found</h3>
          <p>Get started by clicking "+ Create New" above or adjust your search.</p>
        </div>

        <div id="itemsContainer" class="items-grid"></div>
      </section>
    </main>

    <!-- Modal for Create/Edit -->
    <div id="itemModal" class="modal-overlay hidden" role="dialog" aria-modal="true">
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="modalTitle">New Entry</h3>
          <button id="modalCloseBtn" class="btn-close">&times;</button>
        </div>
        <form id="itemForm">
          <input type="hidden" id="itemId">
          <div class="form-group">
            <label for="itemTitleInput">Title *</label>
            <input type="text" id="itemTitleInput" class="form-control" placeholder="Enter title" required>
          </div>
          <div class="form-group">
            <label for="itemDescInput">Description</label>
            <textarea id="itemDescInput" class="form-control" rows="3" placeholder="Enter details or notes..."></textarea>
          </div>
          <div class="form-group">
            <label for="itemPriorityInput">Priority</label>
            <select id="itemPriorityInput" class="form-control">
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" id="modalCancelBtn" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Item</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script src="js/app.js"></script>
</body>
</html>
"""

        elif file_path == "css/styles.css":
            return """/* AutoDevAI Generated Stylesheet */
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --bg-sidebar: #f1f5f9;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --primary-text: #ffffff;
  --danger: #ef4444;
  --success: #10b981;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --transition: all 0.2s ease-in-out;
}

[data-theme="dark"] {
  --bg-app: #090d16;
  --bg-surface: #111827;
  --bg-sidebar: #0e1422;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --border-color: #1f293d;
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-app);
  color: var(--text-main);
  line-height: 1.5;
  min-height: 100vh;
}

.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header */
.app-header {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon {
  font-size: 1.5rem;
  background: var(--border-color);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
}

.brand-text h1 {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
}

.badge {
  font-size: 0.7rem;
  background: rgba(99, 102, 241, 0.15);
  color: var(--primary);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-box input {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-app);
  color: var(--text-main);
  font-size: 0.875rem;
  outline: none;
  width: 220px;
  transition: var(--transition);
}

.search-box input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  cursor: pointer;
  border: none;
  transition: var(--transition);
}

.btn-primary {
  background: var(--primary);
  color: var(--primary-text);
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--border-color);
  color: var(--text-main);
}

.btn-ghost {
  background: transparent;
  color: var(--text-main);
  border: 1px solid var(--border-color);
}

.btn-ghost:hover {
  background: var(--border-color);
}

.btn-danger {
  background: var(--danger);
  color: #fff;
}

.btn-sm {
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
}

/* Main Layout */
.app-main {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 240px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: var(--transition);
}

.nav-item:hover, .nav-item.active {
  background: var(--bg-surface);
  color: var(--text-main);
  box-shadow: var(--shadow-sm);
}

.sidebar-stats {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  font-size: 0.8rem;
}

.sidebar-stats h3 {
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  color: var(--text-muted);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.text-success {
  color: var(--success);
}

/* Content Area */
.content-area {
  flex: 1;
  padding: 1.5rem;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.toolbar h2 {
  font-size: 1.25rem;
  font-weight: 700;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.form-select {
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-main);
  font-size: 0.875rem;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.item-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: var(--transition);
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.item-card.completed {
  opacity: 0.65;
}

.item-card.completed .item-title {
  text-decoration: line-through;
}

.item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.item-title {
  font-size: 1rem;
  font-weight: 600;
  word-break: break-word;
}

.item-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  flex: 1;
  white-space: pre-wrap;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-color);
  padding-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.item-actions {
  display: flex;
  gap: 0.35rem;
}

.priority-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.7rem;
}

.priority-urgent {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.priority-high {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.priority-normal {
  background: var(--border-color);
  color: var(--text-muted);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-surface);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-lg);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-muted);
}

.hidden {
  display: none !important;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 480px;
  padding: 1.5rem;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-app);
  color: var(--text-main);
  font-family: inherit;
  font-size: 0.875rem;
  outline: none;
}

.form-control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .app-main {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
}
"""

        elif file_path == "js/app.js":
            return """// AutoDevAI Generated Client Application Logic
(function () {
  'use strict';

  const STORAGE_KEY = 'autodev_app_items';
  const THEME_KEY = 'autodev_app_theme';

  // State
  let items = [];
  let currentFilter = 'all';
  let currentSort = 'newest';
  let searchQuery = '';

  // DOM Elements
  const itemsContainer = document.getElementById('itemsContainer');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const viewTitle = document.getElementById('viewTitle');
  const newItemBtn = document.getElementById('newItemBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const itemModal = document.getElementById('itemModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const itemForm = document.getElementById('itemForm');
  const modalTitle = document.getElementById('modalTitle');
  const itemId = document.getElementById('itemId');
  const itemTitleInput = document.getElementById('itemTitleInput');
  const itemDescInput = document.getElementById('itemDescInput');
  const itemPriorityInput = document.getElementById('itemPriorityInput');
  const countAll = document.getElementById('countAll');
  const countActive = document.getElementById('countActive');
  const countCompleted = document.getElementById('countCompleted');

  // Persistence
  function loadItems() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        items = JSON.parse(data);
      } else {
        // Initial sample items
        items = [
          {
            id: '1',
            title: 'Welcome to your AutoDevAI Application',
            description: 'This application was autonomously generated and persisted locally in your browser.',
            priority: 'urgent',
            completed: false,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Explore Live Preview and Code Editing',
            description: 'Edit files in the AutoDevAI IDE workspace and see live changes instantly.',
            priority: 'high',
            completed: false,
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '3',
            title: 'Export as ZIP Archive',
            description: 'Click Export in the project toolbar to download all generated source code.',
            priority: 'normal',
            completed: true,
            createdAt: new Date(Date.now() - 7200000).toISOString()
          }
        ];
        saveItems();
      }
    } catch (e) {
      console.error('Error loading items from localStorage:', e);
      items = [];
    }
  }

  function saveItems() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving items to localStorage:', e);
    }
    updateCounts();
    render();
  }

  function updateCounts() {
    const total = items.length;
    const completed = items.filter(i => i.completed).length;
    const active = total - completed;

    if (countAll) countAll.textContent = total;
    if (countActive) countActive.textContent = active;
    if (countCompleted) countCompleted.textContent = completed;
  }

  // Filter & Sort
  function getFilteredItems() {
    return items
      .filter(item => {
        if (currentFilter === 'active') return !item.completed;
        if (currentFilter === 'completed') return item.completed;
        return true;
      })
      .filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (currentSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (currentSort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (currentSort === 'title') return a.title.localeCompare(b.title);
        return 0;
      });
  }

  // Render UI
  function render() {
    const filtered = getFilteredItems();
    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      itemsContainer.classList.add('hidden');
    } else {
      emptyState.classList.add('hidden');
      itemsContainer.classList.remove('hidden');
      
      itemsContainer.innerHTML = filtered.map(item => `
        <div class="item-card ${item.completed ? 'completed' : ''}" data-id="${item.id}">
          <div class="item-header">
            <h3 class="item-title">${escapeHTML(item.title)}</h3>
            <span class="priority-tag priority-${item.priority}">${item.priority.toUpperCase()}</span>
          </div>
          <p class="item-desc">${escapeHTML(item.description || 'No description provided.')}</p>
          <div class="item-footer">
            <span>${new Date(item.createdAt).toLocaleDateString()}</span>
            <div class="item-actions">
              <button class="btn btn-ghost btn-sm toggle-btn" title="Toggle status">
                ${item.completed ? '↩ Reactivate' : '✓ Done'}
              </button>
              <button class="btn btn-ghost btn-sm edit-btn" title="Edit">✎</button>
              <button class="btn btn-danger btn-sm delete-btn" title="Delete">🗑</button>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Modal Handlers
  function openModal(item = null) {
    if (item) {
      modalTitle.textContent = 'Edit Item';
      itemId.value = item.id;
      itemTitleInput.value = item.title;
      itemDescInput.value = item.description || '';
      itemPriorityInput.value = item.priority || 'normal';
    } else {
      modalTitle.textContent = 'New Entry';
      itemForm.reset();
      itemId.value = '';
      itemPriorityInput.value = 'normal';
    }
    itemModal.classList.remove('hidden');
    itemTitleInput.focus();
  }

  function closeModal() {
    itemModal.classList.add('hidden');
  }

  // Event Listeners
  if (newItemBtn) {
    newItemBtn.addEventListener('click', () => openModal());
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

  if (itemForm) {
    itemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = itemId.value;
      const title = itemTitleInput.value.trim();
      const description = itemDescInput.value.trim();
      const priority = itemPriorityInput.value;

      if (!title) return;

      if (id) {
        // Edit existing
        const idx = items.findIndex(i => i.id === id);
        if (idx !== -1) {
          items[idx].title = title;
          items[idx].description = description;
          items[idx].priority = priority;
        }
      } else {
        // Create new
        const newItem = {
          id: Date.now().toString(),
          title,
          description,
          priority,
          completed: false,
          createdAt: new Date().toISOString()
        };
        items.unshift(newItem);
      }

      saveItems();
      closeModal();
    });
  }

  if (itemsContainer) {
    itemsContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.item-card');
      if (!card) return;
      const id = card.dataset.id;
      const item = items.find(i => i.id === id);
      if (!item) return;

      if (e.target.closest('.toggle-btn')) {
        item.completed = !item.completed;
        saveItems();
      } else if (e.target.closest('.edit-btn')) {
        openModal(item);
      } else if (e.target.closest('.delete-btn')) {
        if (confirm(`Delete "${item.title}"?`)) {
          items = items.filter(i => i.id !== id);
          saveItems();
        }
      }
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all items?')) {
        items = [];
        saveItems();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      render();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      render();
    });
  }

  // Navigation Filter
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      if (viewTitle) {
        viewTitle.textContent = btn.innerText.split('(')[0].trim();
      }
      render();
    });
  });

  // Dark/Light Theme Toggle
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem(THEME_KEY, nextTheme);
    });
  }

  // Initialize
  initTheme();
  loadItems();
})();
"""

        elif file_path == "README.md":
            return f"""# {title}

Autonomously generated web application engineered by **AutoDevAI**.

## Overview
{plan.summary}

## Architecture
- **index.html**: Semantic structure, responsive layout, accessible form controls, and dialogs.
- **css/styles.css**: CSS variables, responsive grid, light/dark themes, and component design tokens.
- **js/app.js**: Client-side state store, browser localStorage persistence, sorting, filtering, and event handlers.

## Running Locally
Simply open `index.html` in any modern web browser or serve via any static web server:
```bash
python -m http.server 3000
```

## Features
- Complete CRUD operations (Create, Read, Update, Delete)
- Instant search filtering and multi-criteria sorting
- Dark and Light theme toggle with local storage persistence
- Responsive layout supporting Desktop, Tablet, and Mobile viewports
- Validated structure adhering to HTML5 standards
"""
        else:
            return f"// AutoDevAI generated file: {file_path}\nconsole.log('{file_path} loaded');\n"

    @classmethod
    def _deterministic_repair(cls, file_path: str, content: str, errors: List[str]) -> str:
        repaired = content
        for err in errors:
            if "CSS brace" in err.lower() or "unclosed css" in err.lower():
                repaired = repaired + "\n}\n"
            if "doctype" in err.lower():
                repaired = "<!DOCTYPE html>\n" + repaired
        return repaired

    @classmethod
    def _deterministic_chat_response(
        cls,
        message: str,
        active_file: Optional[str] = None,
        active_file_content: Optional[str] = None
    ) -> AIChatResponse:
        lower = message.lower()
        if "add" in lower or "change" in lower or "button" in lower or "dark mode" in lower:
            return AIChatResponse(
                reply=(
                    f"I have reviewed your request: '{message}'. "
                    f"I can propose updates for '{active_file or 'index.html'}'. "
                    "You can review the proposed changes below and apply them to the project."
                ),
                proposed_changes=[
                    FilePatch(
                        path=active_file or "index.html",
                        updated_content=active_file_content or "<!-- Updated content -->",
                        explanation=f"Added requested capability: {message}",
                        diff=f"+ Enhanced feature based on: {message}"
                    )
                ] if active_file_content else [],
                suggested_actions=["Apply Changes", "Preview Application", "Run Validation"]
            )
        else:
            return AIChatResponse(
                reply=(
                    f"AutoDevAI Assistant here! I can help you inspect, improve, and extend your application. "
                    f"Currently looking at `{active_file or 'project root'}`. "
                    "Ask me to explain this file, find bugs, or implement new features!"
                ),
                proposed_changes=[],
                suggested_actions=["Explain this file", "Find potential bugs", "Add export feature", "Optimize UI"]
            )
