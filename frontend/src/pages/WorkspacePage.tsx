import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FileCode,
  Eye,
  Sparkles,
  Download,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { api } from "../services/api";
import {
  ProjectMetadata,
  ProjectFile,
  ValidationReport,
  FilePatch,
} from "../services/types";
import { FileTree } from "../components/workspace/FileTree";
import { CodeEditor } from "../components/workspace/CodeEditor";
import { LivePreview } from "../components/workspace/LivePreview";
import { AIAssistant } from "../components/workspace/AIAssistant";
import { ValidationDrawer } from "../components/workspace/ValidationDrawer";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { useNotification } from "../context/NotificationContext";

export const WorkspacePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { notify } = useNotification();

  const [project, setProject] = useState<ProjectMetadata | null>(null);
  const [fileTree, setFileTree] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [originalContents, setOriginalContents] = useState<Record<string, string>>({});
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});

  // Right Panel & Validation states
  const [rightTab, setRightTab] = useState<"preview" | "ai">("preview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [validating, setValidating] = useState(false);

  // Load project and initial tree
  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [meta, tree, val] = await Promise.all([
        api.getProject(projectId),
        api.getFileTree(projectId),
        api.getValidationReport(projectId),
      ]);
      setProject(meta);
      setFileTree(tree);
      setValidationReport(val);

      // Auto-open index.html if available
      const findFirstFile = (nodes: ProjectFile[]): string | null => {
        for (const n of nodes) {
          if (!n.is_dir) return n.path;
          if (n.children) {
            const nested = findFirstFile(n.children);
            if (nested) return nested;
          }
        }
        return null;
      };

      const defaultFile = tree.some((f: ProjectFile) => f.path === "index.html")
        ? "index.html"
        : findFirstFile(tree);

      if (defaultFile) {
        setOpenFiles([defaultFile]);
        setActiveFile(defaultFile);
        loadFileContent(defaultFile);
      }
    } catch (err: any) {
      notify("error", "Failed to load workspace", err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const loadFileContent = async (path: string) => {
    if (!projectId) return;
    if (fileContents[path] !== undefined) return;

    try {
      const res = await api.readFileContent(projectId, path);
      setFileContents((prev) => ({ ...prev, [path]: res.content }));
      setOriginalContents((prev) => ({ ...prev, [path]: res.content }));
      setDirtyMap((prev) => ({ ...prev, [path]: false }));
    } catch (err: any) {
      notify("error", `Failed to read ${path}`, err.message);
    }
  };

  const handleSelectFile = (path: string) => {
    if (!openFiles.includes(path)) {
      setOpenFiles((prev) => [...prev, path]);
    }
    setActiveFile(path);
    loadFileContent(path);
  };

  const handleCloseTab = (path: string) => {
    if (dirtyMap[path]) {
      if (!confirm(`File '${path}' has unsaved changes. Discard changes?`)) {
        return;
      }
    }

    const remaining = openFiles.filter((p) => p !== path);
    setOpenFiles(remaining);

    if (activeFile === path) {
      const nextActive = remaining.length > 0 ? remaining[remaining.length - 1] : null;
      setActiveFile(nextActive);
      if (nextActive) loadFileContent(nextActive);
    }
  };

  const handleContentChange = (content: string) => {
    if (!activeFile) return;
    setFileContents((prev) => ({ ...prev, [activeFile]: content }));
    setDirtyMap((prev) => ({
      ...prev,
      [activeFile]: content !== originalContents[activeFile],
    }));
  };

  const handleSaveActiveFile = async () => {
    if (!projectId || !activeFile) return;
    const content = fileContents[activeFile] ?? "";

    try {
      await api.updateFile(projectId, activeFile, content);
      setOriginalContents((prev) => ({ ...prev, [activeFile]: content }));
      setDirtyMap((prev) => ({ ...prev, [activeFile]: false }));
      notify("success", "Saved", `Saved changes to '${activeFile}'`);

      // Trigger automatic re-validation in background
      api.getValidationReport(projectId)
        .then(setValidationReport)
        .catch(console.error);
    } catch (err: any) {
      notify("error", "Save Failed", err.message);
    }
  };

  const handleRevertActiveFile = () => {
    if (!activeFile) return;
    const orig = originalContents[activeFile] ?? "";
    setFileContents((prev) => ({ ...prev, [activeFile]: orig }));
    setDirtyMap((prev) => ({ ...prev, [activeFile]: false }));
    notify("info", "Reverted", `Changes discarded for '${activeFile}'`);
  };

  const handleCreateFile = async (path: string) => {
    if (!projectId) return;
    try {
      await api.createFile(projectId, path, "");
      notify("success", "File Created", `Created '${path}'`);
      const updatedTree = await api.getFileTree(projectId);
      setFileTree(updatedTree);
      handleSelectFile(path);
    } catch (err: any) {
      notify("error", "File Creation Failed", err.message);
    }
  };

  const handleRenameFile = async (oldPath: string, newPath: string) => {
    if (!projectId) return;
    try {
      await api.renameFile(projectId, oldPath, newPath);
      notify("success", "Renamed", `Moved '${oldPath}' to '${newPath}'`);
      const updatedTree = await api.getFileTree(projectId);
      setFileTree(updatedTree);

      // Update open tabs
      setOpenFiles((prev) => prev.map((p) => (p === oldPath ? newPath : p)));
      if (activeFile === oldPath) setActiveFile(newPath);
    } catch (err: any) {
      notify("error", "Rename Failed", err.message);
    }
  };

  const handleDeleteFile = async (path: string) => {
    if (!projectId) return;
    try {
      await api.deleteFile(projectId, path);
      notify("success", "File Deleted", `Deleted '${path}'`);
      const updatedTree = await api.getFileTree(projectId);
      setFileTree(updatedTree);
      handleCloseTab(path);
    } catch (err: any) {
      notify("error", "Deletion Failed", err.message);
    }
  };

  const handleApplyPatches = async (patches: FilePatch[]) => {
    if (!projectId) return;
    try {
      await api.applyAIPatches(projectId, patches);
      notify("success", "AI Changes Applied", `Updated ${patches.length} project file(s)`);
      const updatedTree = await api.getFileTree(projectId);
      setFileTree(updatedTree);

      // Invalidate file cache for modified paths
      for (const p of patches) {
        setFileContents((prev) => ({ ...prev, [p.path]: p.updated_content }));
        setOriginalContents((prev) => ({ ...prev, [p.path]: p.updated_content }));
        setDirtyMap((prev) => ({ ...prev, [p.path]: false }));
      }

      // Re-validate
      const val = await api.getValidationReport(projectId);
      setValidationReport(val);
    } catch (err: any) {
      notify("error", "Apply Patch Failed", err.message);
    }
  };

  const handleRunValidation = async () => {
    if (!projectId) return;
    try {
      setValidating(true);
      const val = await api.getValidationReport(projectId);
      setValidationReport(val);
      notify("info", "Validation Updated", `${val.passed} checks passed, ${val.failed} failed`);
    } catch (err: any) {
      notify("error", "Validation Failed", err.message);
    } finally {
      setValidating(false);
    }
  };

  if (loading || !project || !projectId) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center text-xs text-theme-text-muted gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-theme-accent" />
        <span>Loading workspace environment...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-theme-bg-primary overflow-hidden">
      {/* Workspace Top Toolbar */}
      <div className="h-11 px-4 border-b border-theme-border bg-theme-bg-secondary flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <Link
            to="/projects"
            className="flex items-center gap-1 text-xs text-theme-text-muted hover:text-theme-text transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Projects</span>
          </Link>
          <span className="text-theme-border font-light">/</span>
          <h3 className="text-xs font-bold text-theme-text flex items-center gap-2">
            <span className="truncate max-w-xs">{project.name}</span>
            <Badge status={project.status} size="sm" />
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Panel Toggle: Preview vs AI Assistant */}
          <div className="flex items-center bg-theme-bg-card p-0.5 rounded-lg border border-theme-border">
            <button
              onClick={() => setRightTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                rightTab === "preview"
                  ? "bg-theme-accent text-white shadow-sm"
                  : "text-theme-text-muted hover:text-theme-text"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
            <button
              onClick={() => setRightTab("ai")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                rightTab === "ai"
                  ? "bg-theme-accent text-white shadow-sm"
                  : "text-theme-text-muted hover:text-theme-text"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>
          </div>

          <a href={api.getExportUrl(projectId)} download>
            <Button size="sm" variant="outline" icon={<Download className="w-3.5 h-3.5" />}>
              <span className="hidden sm:inline">Export ZIP</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Tree Explorer */}
        <div className={`w-60 shrink-0 transition-all ${sidebarCollapsed ? "hidden" : "block"}`}>
          <FileTree
            files={fileTree}
            activeFile={activeFile}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onRenameFile={handleRenameFile}
            onDeleteFile={handleDeleteFile}
          />
        </div>

        {/* Center: Tabbed Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              openFiles={openFiles}
              activeFile={activeFile}
              fileContent={activeFile ? fileContents[activeFile] ?? "" : ""}
              isDirty={activeFile ? Boolean(dirtyMap[activeFile]) : false}
              onSelectTab={(p: string) => {
                setActiveFile(p);
                loadFileContent(p);
              }}
              onCloseTab={handleCloseTab}
              onChangeContent={handleContentChange}
              onSave={handleSaveActiveFile}
              onRevert={handleRevertActiveFile}
            />
          </div>

          {/* Bottom Validation Drawer */}
          <ValidationDrawer
            report={validationReport}
            loading={validating}
            onRefresh={handleRunValidation}
          />
        </div>

        {/* Right: Live Preview OR AI Assistant Dock */}
        <div className="w-[450px] lg:w-[500px] shrink-0 border-l border-theme-border flex flex-col bg-theme-bg-card">
          {rightTab === "preview" ? (
            <LivePreview projectId={projectId} />
          ) : (
            <AIAssistant
              projectId={projectId}
              activeFile={activeFile}
              activeFileContent={activeFile ? fileContents[activeFile] ?? "" : ""}
              onApplyPatches={handleApplyPatches}
            />
          )}
        </div>
      </div>
    </div>
  );
};
