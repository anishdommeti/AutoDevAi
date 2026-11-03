import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  FileCode,
  ArrowRight,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { GenerationStatusResponse } from "../../services/types";
import { Button } from "../common/Button";

interface GenerationProgressViewProps {
  status: GenerationStatusResponse;
  projectName: string;
  onRetry: () => void;
}

export const GenerationProgressView: React.FC<GenerationProgressViewProps> = ({
  status,
  projectName,
  onRetry,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [status.logs]);

  const isCompleted = status.status === "completed";
  const isFailed = status.status === "failed";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header & Status Card */}
      <div className="p-6 rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                Autonomous Agent Execution
              </span>
              <span className="text-xs text-theme-text-muted">Target: {projectName}</span>
            </div>
            <h3 className="text-xl font-bold text-theme-text mt-1">
              {isCompleted
                ? "Generation & Validation Complete!"
                : isFailed
                ? "Generation Encountered Issues"
                : "AutoDevAI is Synthesizing Your Project..."}
            </h3>
          </div>

          <div>
            {isCompleted && (
              <Link to={`/workspace/${status.project_id}`}>
                <Button size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  Open in Workspace IDE
                </Button>
              </Link>
            )}
            {isFailed && (
              <Button size="md" variant="danger" onClick={onRetry} icon={<RotateCcw className="w-4 h-4" />}>
                Retry Autonomous Build
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-theme-text-muted capitalize">
              {status.current_stage.replace("_", " ")}
            </span>
            <span className="text-theme-accent">{status.progress_pct}%</span>
          </div>
          <div className="w-full h-2.5 bg-theme-bg-secondary rounded-full overflow-hidden border border-theme-border">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isFailed ? "bg-rose-500" : "bg-theme-accent"
              }`}
              style={{ width: `${status.progress_pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stages Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm space-y-3">
          <h4 className="text-sm font-semibold text-theme-text flex items-center gap-2">
            <Clock className="w-4 h-4 text-theme-accent" />
            Agent Pipeline Stages
          </h4>

          <div className="space-y-2.5">
            {status.stages.map((stage, idx) => (
              <div
                key={stage.stage}
                className="flex items-start gap-3 p-2.5 rounded-lg border border-theme-border bg-theme-bg-secondary text-xs transition-colors"
              >
                <div className="mt-0.5 shrink-0">
                  {stage.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : stage.status === "running" ? (
                    <Loader2 className="w-4 h-4 text-theme-accent animate-spin" />
                  ) : stage.status === "failed" ? (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-theme-border flex items-center justify-center text-[9px] font-bold text-theme-text-muted">
                      {idx + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-theme-text">{stage.title}</div>
                  {stage.details && (
                    <div className="text-[11px] text-theme-text-muted mt-0.5">{stage.details}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Created Files Pills */}
          {status.created_files.length > 0 && (
            <div className="pt-3 border-t border-theme-border">
              <span className="text-[11px] font-semibold text-theme-text-muted block mb-2">
                Synthesized Files ({status.created_files.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {status.created_files.map((file) => (
                  <span
                    key={file}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-theme-bg-tertiary border border-theme-border text-[11px] font-mono text-theme-text"
                  >
                    <FileCode className="w-3 h-3 text-theme-accent" />
                    {file}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Agent Terminal Log */}
        <div className="p-5 rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm flex flex-col h-[380px]">
          <h4 className="text-sm font-semibold text-theme-text flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-theme-accent" />
            Agent Activity Stream
          </h4>

          <div
            ref={logContainerRef}
            className="flex-1 p-3 rounded-xl bg-black/90 text-emerald-400 font-mono text-[11px] overflow-y-auto space-y-1 select-text border border-emerald-950"
          >
            {status.logs.length === 0 ? (
              <div className="text-zinc-500">Connecting to agent daemon...</div>
            ) : (
              status.logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

