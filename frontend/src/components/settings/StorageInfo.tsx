import React, { useEffect, useState } from "react";
import { HardDrive, FolderOpen, FileCode, Server } from "lucide-react";
import { api } from "../../services/api";
import { SettingsResponse } from "../../services/types";

export const StorageInfo: React.FC = () => {
  const [info, setInfo] = useState<SettingsResponse | null>(null);

  useEffect(() => {
    api.getSettings().then(setInfo).catch(console.error);
  }, []);

  if (!info) return null;

  return (
    <div className="p-5 rounded-xl border border-theme-border bg-theme-bg-card shadow-sm space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-theme-text flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-theme-accent" />
          Local Storage & System Architecture
        </h4>
        <p className="text-xs text-theme-text-muted mt-0.5">
          AutoDevAI persists projects locally as discrete filesystem directories with validated JSON metadata.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-theme-bg-secondary border border-theme-border">
          <div className="text-theme-text-muted">Total Stored Projects</div>
          <div className="text-lg font-bold text-theme-text mt-1">{info.total_projects}</div>
        </div>

        <div className="p-3 rounded-lg bg-theme-bg-secondary border border-theme-border">
          <div className="text-theme-text-muted">Total Source Files</div>
          <div className="text-lg font-bold text-theme-text mt-1">{info.total_files}</div>
        </div>

        <div className="p-3 rounded-lg bg-theme-bg-secondary border border-theme-border">
          <div className="text-theme-text-muted">Disk Footprint</div>
          <div className="text-lg font-bold text-theme-text mt-1">{info.total_size_mb} MB</div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-theme-bg-secondary border border-theme-border text-xs">
        <div className="font-semibold text-theme-text mb-1">Authoritative Data Directory:</div>
        <code className="text-[11px] font-mono text-theme-accent break-all">{info.data_dir}</code>
      </div>
    </div>
  );
};

