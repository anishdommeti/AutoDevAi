import React from "react";
import { ActivityItem } from "../../services/types";
import { Sparkles, FileText, CheckCircle, Trash2, Download, History } from "lucide-react";

export const ActivityFeed: React.FC<{ activities: ActivityItem[] }> = ({ activities }) => {
  if (activities.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "created":
      case "generated":
        return <Sparkles className="w-4 h-4 text-theme-accent" />;
      case "edited":
        return <FileText className="w-4 h-4 text-sky-500" />;
      case "validated":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "exported":
        return <Download className="w-4 h-4 text-amber-500" />;
      case "deleted":
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      default:
        return <History className="w-4 h-4 text-theme-text-muted" />;
    }
  };

  return (
    <div className="p-5 rounded-xl border border-theme-border bg-theme-bg-card shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-theme-text flex items-center gap-2">
          <History className="w-4 h-4 text-theme-accent" />
          Recent Agent Activity Log
        </h4>
        <span className="text-xs text-theme-text-muted">Authoritative Event Feed</span>
      </div>

      <div className="divide-y divide-theme-border">
        {activities.slice(0, 5).map((act) => (
          <div key={act.id} className="py-2.5 flex items-start gap-3 text-xs">
            <div className="p-1 rounded bg-theme-bg-secondary mt-0.5">{getIcon(act.activity_type)}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-theme-text">{act.project_name}</span>
                <span className="text-[10px] text-theme-text-muted">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-theme-text-muted mt-0.5">{act.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

