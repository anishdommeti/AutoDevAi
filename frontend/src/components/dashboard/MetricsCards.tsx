import React from "react";
import { FolderGit2, CheckCircle2, FileCode2, Clock, Code2 } from "lucide-react";
import { DashboardMetrics } from "../../services/types";

export const MetricsCards: React.FC<{ metrics: DashboardMetrics | null }> = ({ metrics }) => {
  const cards = [
    {
      title: "Total Projects",
      value: metrics ? metrics.total_projects : 0,
      description: "Persisted in local filesystem",
      icon: <FolderGit2 className="w-5 h-5 text-indigo-500" />,
      color: "border-indigo-500/20 bg-indigo-500/5",
    },
    {
      title: "Ready & Verified",
      value: metrics ? metrics.ready_projects : 0,
      description: "Passed validation checks",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      color: "border-emerald-500/20 bg-emerald-500/5",
    },
    {
      title: "Total Source Files",
      value: metrics ? metrics.total_files : 0,
      description: "Generated & validated files",
      icon: <FileCode2 className="w-5 h-5 text-sky-500" />,
      color: "border-sky-500/20 bg-sky-500/5",
    },
    {
      title: "Lines of Code",
      value: metrics ? metrics.total_lines_of_code.toLocaleString() : 0,
      description: "Synthesized production code",
      icon: <Code2 className="w-5 h-5 text-amber-500" />,
      color: "border-amber-500/20 bg-amber-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-theme-border bg-theme-bg-card shadow-sm hover:shadow transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-theme-text-muted">{c.title}</span>
            <div className={`p-2 rounded-lg border ${c.color}`}>{c.icon}</div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-theme-text tracking-tight">{c.value}</h3>
            <p className="text-[11px] text-theme-text-muted mt-0.5">{c.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

