import {
  ProjectMetadata,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectFile,
  GenerationStatusResponse,
  ValidationReport,
  AIChatRequest,
  AIChatResponse,
  CodeExplainRequest,
  CodeExplainResponse,
  DashboardMetrics,
  SettingsResponse,
  ConnectionTestResponse,
  FilePatch,
} from "./types";

const API_BASE = "http://localhost:8000/api/v1";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Health & Settings
  getHealth: () => request<{ status: string; gemini_configured: boolean; gemini_model: string }>("/health"),
  getSettings: () => request<SettingsResponse>("/settings"),
  testGeminiConnection: () => request<ConnectionTestResponse>("/settings/test-connection", { method: "POST" }),
  getDashboardMetrics: () => request<DashboardMetrics>("/dashboard/metrics"),

  // Projects CRUD
  listProjects: (params?: { search?: string; category?: string; status?: string; sort_by?: string; order?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.category) query.append("category", params.category);
    if (params?.status) query.append("status", params.status);
    if (params?.sort_by) query.append("sort_by", params.sort_by);
    if (params?.order) query.append("order", params.order);
    return request<ProjectMetadata[]>(`/projects?${query.toString()}`);
  },
  createProject: (data: ProjectCreateRequest) => request<ProjectMetadata>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getProject: (projectId: string) => request<ProjectMetadata>(`/projects/${projectId}`),
  updateProject: (projectId: string, data: ProjectUpdateRequest) => request<ProjectMetadata>(`/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  deleteProject: (projectId: string) => request<{ success: boolean }>(`/projects/${projectId}`, {
    method: "DELETE",
  }),
  duplicateProject: (projectId: string, newName?: string) => request<ProjectMetadata>(`/projects/${projectId}/duplicate`, {
    method: "POST",
    body: JSON.stringify({ new_name: newName }),
  }),

  // File Operations
  getFileTree: (projectId: string) => request<ProjectFile[]>(`/projects/${projectId}/files`),
  readFileContent: (projectId: string, path: string) => 
    request<{ path: string; content: string }>(`/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`),
  createFile: (projectId: string, path: string, content: string = "") => 
    request<{ success: boolean; path: string }>(`/projects/${projectId}/files`, {
      method: "POST",
      body: JSON.stringify({ path, content }),
    }),
  updateFile: (projectId: string, path: string, content: string) => 
    request<{ success: boolean; path: string }>(`/projects/${projectId}/files?path=${encodeURIComponent(path)}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
  deleteFile: (projectId: string, path: string) => 
    request<{ success: boolean; path: string }>(`/projects/${projectId}/files?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
    }),
  renameFile: (projectId: string, oldPath: string, newPath: string) => 
    request<{ success: boolean }>(`/projects/${projectId}/files/rename?old_path=${encodeURIComponent(oldPath)}`, {
      method: "POST",
      body: JSON.stringify({ new_path: newPath }),
    }),

  // Autonomous Generation
  startGeneration: (projectId: string, data: { prompt: string; category?: string; design_style?: string; color_scheme?: string; additional_instructions?: string }) => 
    request<GenerationStatusResponse>(`/projects/${projectId}/generation/start`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getGenerationStatus: (projectId: string) => request<GenerationStatusResponse>(`/projects/${projectId}/generation/status`),
  retryGeneration: (projectId: string) => request<GenerationStatusResponse>(`/projects/${projectId}/generation/retry`, {
    method: "POST",
  }),

  // Validation
  getValidationReport: (projectId: string) => request<ValidationReport>(`/projects/${projectId}/validation`, {
    method: "POST",
  }),

  // AI Assistant
  chatAI: (data: AIChatRequest) => request<AIChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  explainCode: (data: CodeExplainRequest) => request<CodeExplainResponse>("/ai/explain", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  applyAIPatches: (projectId: string, patches: FilePatch[]) => request<{ success: boolean; applied_files: string[] }>("/ai/apply-patch", {
    method: "POST",
    body: JSON.stringify({ project_id: projectId, patches }),
  }),

  // Export & Preview URLs
  getExportUrl: (projectId: string) => `http://localhost:8000/api/v1/projects/${projectId}/export`,
  getPreviewUrl: (projectId: string) => `http://localhost:8000/preview/${projectId}/`,
};

