import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { DashboardMetrics, ProjectMetadata } from "../services/types";
import { MetricsCards } from "../components/dashboard/MetricsCards";
import { StatsChart } from "../components/dashboard/StatsChart";
import { RecentProjects } from "../components/dashboard/RecentProjects";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { EmptyState } from "../components/dashboard/EmptyState";
import { Modal } from "../components/common/Modal";
import { Button } from "../components/common/Button";
import { useNotification } from "../context/NotificationContext";
import { Loader2 } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { notify } = useNotification();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [projectToDelete, setProjectToDelete] = useState<ProjectMetadata | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [m, p] = await Promise.all([
        api.getDashboardMetrics(),
        api.listProjects(),
      ]);
      setMetrics(m);
      setProjects(p);
    } catch (err: any) {
      notify("error", "Failed to load dashboard data", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDuplicate = async (project: ProjectMetadata) => {
    try {
      const duplicated = await api.duplicateProject(project.id);
      notify("success", "Project Duplicated", `Created copy: ${duplicated.name}`);
      fetchData();
    } catch (err: any) {
      notify("error", "Duplication Failed", err.message);
    }
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setDeleting(true);
      await api.deleteProject(projectToDelete.id);
      notify("success", "Project Deleted", `Deleted '${projectToDelete.name}'`);
      setProjectToDelete(null);
      fetchData();
    } catch (err: any) {
      notify("error", "Deletion Failed", err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center text-xs text-theme-text-muted gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-theme-accent" />
        <span>Loading project dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Metrics Banner */}
      <MetricsCards metrics={metrics} />

      {/* When no projects exist */}
      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Charts (Category and Status breakdown) */}
          <StatsChart metrics={metrics} />

          {/* Recent Projects Grid */}
          <RecentProjects
            projects={projects}
            onDuplicate={handleDuplicate}
            onDelete={(p) => setProjectToDelete(p)}
          />

          {/* Activity Feed */}
          {metrics && <ActivityFeed activities={metrics.recent_activity} />}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        title="Confirm Project Deletion"
        description="This action cannot be undone. All source files and project metadata will be removed from disk."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-theme-text">
            Are you sure you want to permanently delete{" "}
            <strong>"{projectToDelete?.name}"</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setProjectToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={confirmDelete}>
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
