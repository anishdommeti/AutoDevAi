import React from "react";
import { DashboardMetrics } from "../../services/types";
import { BarChart3, PieChart } from "lucide-react";

export const StatsChart: React.FC<{ metrics: DashboardMetrics | null }> = ({ metrics }) => {
  if (!metrics || metrics.total_projects === 0) return null;

  const categories = Object.entries(metrics.category_distribution || {});
  const maxCount = Math.max(...categories.map(([, count]) => count), 1);

  const statuses = [
    { label: "Ready", count: metrics.ready_projects, color: "bg-emerald-500", text: "text-emerald-500" },
    { label: "Generating", count: metrics.generating_projects, color: "bg-amber-500", text: "text-amber-500" },
    { label: "Failed", count: metrics.failed_projects, color: "bg-rose-500", text: "text-rose-500" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Category Breakdown (2 Cols) */}
      <div className="lg:col-span-2 p-5 rounded-xl border border-theme-border bg-theme-bg-card shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-theme-accent" />
            <h4 className="text-sm font-semibold text-theme-text">Project Category Distribution</h4>
          </div>
          <span className="text-xs text-theme-text-muted">Real Persisted Data</span>
        </div>

        {categories.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs text-theme-text-muted">
            No categories recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map(([category, count]) => {
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-theme-text">
                    <span>{category}</span>
                    <span className="text-theme-text-muted">{count} project{count > 1 ? "s" : ""}</span>
                  </div>
                  <div className="w-full h-3 bg-theme-bg-secondary rounded-full overflow-hidden border border-theme-border">
                    <div
                      className="h-full bg-theme-accent rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Status Breakdown (1 Col) */}
      <div className="p-5 rounded-xl border border-theme-border bg-theme-bg-card shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-theme-accent" />
            <h4 className="text-sm font-semibold text-theme-text">Generation Health</h4>
          </div>

          <div className="space-y-3">
            {statuses.map((s) => {
              const pct = metrics.total_projects > 0 ? Math.round((s.count / metrics.total_projects) * 100) : 0;
              return (
                <div key={s.label} className="p-3 rounded-lg bg-theme-bg-secondary border border-theme-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${s.color}`} />
                    <span className="text-xs font-medium text-theme-text">{s.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-theme-text">{s.count}</span>
                    <span className="text-[11px] text-theme-text-muted ml-1.5">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-theme-border mt-3 text-[11px] text-theme-text-muted flex justify-between">
          <span>Success Rate:</span>
          <span className="font-semibold text-theme-text">
            {metrics.total_projects > 0
              ? `${Math.round((metrics.ready_projects / metrics.total_projects) * 100)}%`
              : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
};

