import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";
import { ValidationReport, ValidationCheck } from "../../services/types";
import { Button } from "../common/Button";

interface ValidationDrawerProps {
  report: ValidationReport | null;
  loading: boolean;
  onRefresh: () => void;
}

export const ValidationDrawer: React.FC<ValidationDrawerProps> = ({
  report,
  loading,
  onRefresh,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!report) {
    return (
      <div className="border-t border-theme-border bg-theme-bg-secondary p-2.5 flex items-center justify-between text-xs text-theme-text-muted">
        <span>No validation report available.</span>
        <Button size="sm" variant="secondary" onClick={onRefresh} loading={loading}>
          Run Checks
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case "failed":
        return <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
      default:
        return <ShieldAlert className="w-3.5 h-3.5 text-theme-text-muted shrink-0" />;
    }
  };

  return (
    <div className="border-t border-theme-border bg-theme-bg-card flex flex-col select-none max-h-56">
      {/* Drawer Header */}
      <div className="h-9 px-3 border-b border-theme-border bg-theme-bg-secondary flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1.5 font-bold text-theme-text hover:text-theme-accent"
          >
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Validation & Quality Report</span>
          </button>
          <span className="text-emerald-500 font-semibold">{report.passed} Passed</span>
          {report.warnings > 0 && <span className="text-amber-500 font-semibold">{report.warnings} Warnings</span>}
          {report.failed > 0 && <span className="text-rose-500 font-semibold">{report.failed} Failed</span>}
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          loading={loading}
          icon={<RotateCcw className="w-3 h-3" />}
        >
          Re-validate
        </Button>
      </div>

      {/* Drawer Body (Checks List) */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
          {report.checks.map((chk, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-1.5 rounded bg-theme-bg-secondary/60 hover:bg-theme-bg-secondary border border-transparent hover:border-theme-border transition-colors"
            >
              <div className="mt-0.5">{getStatusIcon(chk.status)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-theme-text">{chk.name}</span>
                  {chk.file && (
                    <span className="px-1.5 py-0.2 rounded bg-theme-bg-tertiary font-mono text-[10px] text-theme-text-muted">
                      {chk.file}
                    </span>
                  )}
                  <span className="text-[10px] uppercase text-theme-text-muted ml-auto font-medium">
                    {chk.category}
                  </span>
                </div>
                <p className="text-[11px] text-theme-text-muted mt-0.5">{chk.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

