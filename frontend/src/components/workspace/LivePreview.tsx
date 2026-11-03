import React, { useState } from "react";
import {
  RotateCcw,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { api } from "../../services/api";

interface LivePreviewProps {
  projectId: string;
}

type ViewportMode = "desktop" | "tablet" | "mobile";

export const LivePreview: React.FC<LivePreviewProps> = ({ projectId }) => {
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const previewUrl = api.getPreviewUrl(projectId);

  const handleRefresh = () => {
    setLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  const viewportWidths = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  };

  return (
    <div className="h-full flex flex-col bg-theme-bg-secondary select-none">
      {/* Preview Header & Controls */}
      <div className="h-10 px-3 border-b border-theme-border bg-theme-bg-card flex items-center justify-between">
        {/* Device Viewport Selector */}
        <div className="flex items-center gap-1 bg-theme-bg-secondary p-0.5 rounded-lg border border-theme-border">
          <button
            onClick={() => setViewport("desktop")}
            className={`p-1 rounded text-xs transition-colors ${
              viewport === "desktop"
                ? "bg-theme-bg-card text-theme-accent font-semibold shadow-sm"
                : "text-theme-text-muted hover:text-theme-text"
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport("tablet")}
            className={`p-1 rounded text-xs transition-colors ${
              viewport === "tablet"
                ? "bg-theme-bg-card text-theme-accent font-semibold shadow-sm"
                : "text-theme-text-muted hover:text-theme-text"
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`p-1 rounded text-xs transition-colors ${
              viewport === "mobile"
                ? "bg-theme-bg-card text-theme-accent font-semibold shadow-sm"
                : "text-theme-text-muted hover:text-theme-text"
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Security Sandbox Indicator */}
        <div className="flex items-center gap-1 text-[11px] text-theme-text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden sm:inline">Sandboxed Iframe</span>
        </div>

        {/* Actions: Refresh & External Tab */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-secondary transition-colors"
            title="Reload Preview"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-secondary transition-colors"
            title="Open in new window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-theme-bg-secondary/80">
        <div
          className={`h-full transition-all duration-300 rounded-xl overflow-hidden border border-theme-border shadow-md bg-white relative ${viewportWidths[viewport]}`}
        >
          {loading && (
            <div className="absolute inset-0 bg-theme-bg-card/70 backdrop-blur-xs flex items-center justify-center text-xs text-theme-text gap-2 z-10">
              <Loader2 className="w-4 h-4 animate-spin text-theme-accent" />
              <span>Rendering application...</span>
            </div>
          )}

          <iframe
            key={reloadKey}
            src={`${previewUrl}?t=${reloadKey}`}
            title="Application Live Preview"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>
    </div>
  );
};

