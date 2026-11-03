export type ProjectStatus = "created" | "generating" | "ready" | "failed";

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  target_output: string;
  design_style: string;
  color_scheme: string;
  created_at: string;
  updated_at: string;
  status: ProjectStatus;
  file_count: number;
  total_size_bytes: number;
  last_generation_at?: string;
  generation_error?: string;
  tags: string[];
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
  category?: string;
  target_output?: string;
  design_style?: string;
  color_scheme?: string;
  prompt?: string;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  category?: string;
  design_style?: string;
  color_scheme?: string;
  tags?: string[];
}

export interface ProjectFile {
  path: string;
  name: string;
  is_dir: boolean;
  size: number;
  extension?: string;
  content?: string;
  updated_at: string;
  children?: ProjectFile[];
}

export interface StageProgress {
  stage: string;
  title: string;
  status: "pending" | "running" | "completed" | "failed";
  started_at?: string;
  completed_at?: string;
  details?: string;
}

export interface GenerationStatusResponse {
  project_id: string;
  status: "idle" | "running" | "completed" | "failed";
  current_stage: string;
  progress_pct: number;
  stages: StageProgress[];
  logs: string[];
  error?: string;
  created_files: string[];
}

export interface ValidationCheck {
  name: string;
  category: "syntax" | "references" | "structure" | "security";
  status: "passed" | "failed" | "warning" | "not_applicable";
  message: string;
  file?: string;
  line?: number;
}

export interface ValidationReport {
  project_id: string;
  timestamp: string;
  total_checks: number;
  passed: number;
  failed: number;
  warnings: number;
  checks: ValidationCheck[];
  is_valid: boolean;
}

export interface FilePatch {
  path: string;
  original_content?: string;
  updated_content: string;
  explanation: string;
  diff?: string;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  target_file?: string;
  diff?: string;
}

export interface AIChatRequest {
  project_id?: string;
  message: string;
  active_file?: string;
  active_file_content?: string;
  history?: AIChatMessage[];
}

export interface AIChatResponse {
  reply: string;
  proposed_changes: FilePatch[];
  suggested_actions: string[];
}

export interface CodeExplainRequest {
  project_id: string;
  file_path: string;
  code_snippet?: string;
}

export interface CodeExplainResponse {
  summary: string;
  key_components: string[];
  best_practices: string[];
  suggestions: string[];
}

export interface ActivityItem {
  id: string;
  project_id: string;
  project_name: string;
  activity_type: string;
  description: string;
  timestamp: string;
}

export interface DashboardMetrics {
  total_projects: number;
  ready_projects: number;
  generating_projects: number;
  failed_projects: number;
  total_files: number;
  total_lines_of_code: number;
  recent_activity: ActivityItem[];
  category_distribution: Record<string, number>;
}

export interface SettingsResponse {
  app_name: string;
  version: string;
  gemini_configured: boolean;
  gemini_model: string;
  data_dir: string;
  total_projects: number;
  total_files: number;
  total_size_mb: number;
}

export interface ConnectionTestResponse {
  success: boolean;
  model: string;
  latency_ms?: number;
  message: string;
  error_details?: string;
}
