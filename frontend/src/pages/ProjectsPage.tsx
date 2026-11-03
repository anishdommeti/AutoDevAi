import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderGit2,
  Search,
  Plus,
  Code,
  Download,
  Copy,
  Trash2,
} from "lucide-react";
import { api } from "../services/api";
import { ProjectMetadata } from "../services/types";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { useNotification } from "../context/NotificationContext";

export const ProjectsPage: React.FC = () => {
  const { notify } = useNotification();
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");

  // Deletion modal
  const [projectToDelete, setProjectToDelete] = useState<ProjectMetadata | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api.listProjects({
        search: search || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sort_by: sortBy,
      });
      setProjects(data);
    } catch (err: any) {
      notify("error", "Failed to fetch projects", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, categoryFilter, statusFilter, sortBy]);

  const handleDuplicate = async (project: ProjectMetadata) => {
    try {
      const duplicated = await api.duplicateProject(project.id);
      notify("success", "Project Duplicated", `Created ${duplicated.name}`);
      fetchProjects();
    } catch (err: any) {
      notify("error", "Duplication Failed", err.message);
    }
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setDeleting(true);
      await api.deleteProject(projectToDelete.id);
      notify("success", "Project Deleted", `Deleted ${projectToDelete.name}`);
      setProjectToDelete(null);
      fetchProjects();
    } catch (err: any) {
      notify("error", "Deletion Failed", err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-theme-text tracking-tight">Project Management</h2>
          <p className="text-xs text-theme-text-muted mt-0.5">
            View, search, edit, export, and manage your persisted autonomous applications.
          </p>
        </div>

        <Link to="/new">
          <Button icon={<Plus className="w-4 h-4" />}>New Project</Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-theme-border bg-theme-bg-card shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-theme-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by title or description..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-theme-border bg-theme-bg-secondary text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-1 focus:ring-theme-accent"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-theme-border bg-theme-bg-secondary text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-accent"
          >
            <option value="all">All Categories</option>
            <option value="Productivity">Productivity</option>
            <option value="Dashboard">Dashboard</option>
            <option value="Utilities">Utilities</option>
            <option value="Educational">Educational</option>
            <option value="E-Commerce">E-Commerce</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-theme-border bg-theme-bg-secondary text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-accent"
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready</option>
            <option value="generating">Generating</option>
            <option value="created">Created</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-theme-border bg-theme-bg-secondary text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-accent"
          >
            <option value="updated_at">Sort: Recently Updated</option>
            <option value="created_at">Sort: Created Date</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="file_count">Sort: File Count</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-theme-text-muted">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-theme-border bg-theme-bg-card">
          <FolderGit2 className="w-10 h-10 text-theme-text-muted mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-semibold text-theme-text">No projects match your filter</h4>
          <p className="text-xs text-theme-text-muted mt-1">Try clearing your search or create a new project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-xl border border-theme-border bg-theme-bg-card shadow-sm hover:shadow hover:border-theme-accent/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-theme-text truncate">{p.name}</h3>
                  <Badge status={p.status} />
                </div>

                <p className="text-xs text-theme-text-muted line-clamp-2 mb-4 min-h-[32px]">
                  {p.description || "No project description provided."}
                </p>

                <div className="space-y-1.5 text-[11px] text-theme-text-muted border-t border-theme-border pt-3">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium text-theme-text">{p.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Files generated:</span>
                    <span className="font-medium text-theme-text">{p.file_count} files</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last updated:</span>
                    <span className="font-medium text-theme-text">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-theme-border mt-4">
                <Link to={`/workspace/${p.id}`}>
                  <Button size="sm" icon={<Code className="w-3.5 h-3.5" />}>
                    Open IDE
                  </Button>
                </Link>

                <div className="flex items-center gap-1">
                  <a
                    href={api.getExportUrl(p.id)}
                    download
                    className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-secondary transition-colors"
                    title="Export ZIP"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDuplicate(p)}
                    className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-secondary transition-colors"
                    title="Duplicate project"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setProjectToDelete(p)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        title="Delete Project Confirmation"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-theme-text">
            Are you sure you want to delete <strong>"{projectToDelete?.name}"</strong>? This will permanently delete the project folder and files from the filesystem.
          </p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setProjectToDelete(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" loading={deleting} onClick={confirmDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
