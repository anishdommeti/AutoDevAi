import React from "react";
import { Link } from "react-router-dom";
import { ProjectMetadata } from "../../services/types";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Code, Download, ExternalLink, MoreVertical, Copy, Trash2, Calendar, FileText } from "lucide-react";
import { api } from "../../services/api";

interface RecentProjectsProps {
  projects: ProjectMetadata[];
  onDuplicate: (project: ProjectMetadata) => void;
  onDelete: (project: ProjectMetadata) => void;
}

export const RecentProjects: React.FC<RecentProjectsProps> = ({
  projects,
  onDuplicate,
  onDelete,
}) => {
  if (projects.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-theme-text">Recent Projects</h3>
        <Link to="/projects" className="text-xs font-medium text-theme-accent hover:underline">
          View all projects →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.slice(0, 6).map((project) => (
          <div
            key={project.id}
            className="flex flex-col justify-between p-4 rounded-xl border border-theme-border bg-theme-bg-card hover:border-theme-accent/50 transition-all shadow-sm hover:shadow group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-bold text-theme-text group-hover:text-theme-accent transition-colors truncate">
                  {project.name}
                </h4>
                <Badge status={project.status} />
              </div>

              <p className="text-xs text-theme-text-muted line-clamp-2 mb-3 min-h-[32px]">
                {project.description || "No description provided."}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-theme-text-muted mb-4">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> {project.file_count} files
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(project.updated_at).toLocaleDateString()}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-theme-bg-secondary font-medium">
                  {project.category}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-theme-border">
              <Link to={`/workspace/${project.id}`}>
                <Button size="sm" variant="primary" icon={<Code className="w-3.5 h-3.5" />}>
                  Open Workspace
                </Button>
              </Link>

              <div className="flex items-center gap-1">
                <a
                  href={api.getExportUrl(project.id)}
                  download
                  className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-secondary transition-colors"
                  title="Download ZIP"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => onDuplicate(project)}
                  className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-secondary transition-colors"
                  title="Duplicate project"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(project)}
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
    </div>
  );
};

