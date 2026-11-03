import React from "react";
import { Sliders, Code2, Layout } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export const EditorSettings: React.FC = () => {
  const {
    density,
    setDensity,
    editorFontSize,
    setEditorFontSize,
    editorWordWrap,
    setEditorWordWrap,
    reducedMotion,
    setReducedMotion,
  } = useTheme();

  return (
    <div className="p-5 rounded-xl border border-theme-border bg-theme-bg-card shadow-sm space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-theme-text flex items-center gap-2">
          <Sliders className="w-4 h-4 text-theme-accent" />
          Workspace & Editor Preferences
        </h4>
        <p className="text-xs text-theme-text-muted mt-0.5">
          Configure editor typography, interface density, and animations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Editor Font Size */}
        <div className="space-y-1.5">
          <label className="font-semibold text-theme-text">Editor Font Size ({editorFontSize}px)</label>
          <input
            type="range"
            min={11}
            max={22}
            value={editorFontSize}
            onChange={(e) => setEditorFontSize(Number(e.target.value))}
            className="w-full accent-theme-accent"
          />
        </div>

        {/* Word Wrap */}
        <div className="space-y-1.5">
          <label className="font-semibold text-theme-text">Editor Word Wrap</label>
          <select
            value={editorWordWrap}
            onChange={(e) => setEditorWordWrap(e.target.value as "on" | "off")}
            className="w-full px-3 py-1.5 rounded-lg border border-theme-border bg-theme-bg-secondary text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-accent"
          >
            <option value="on">On (Soft wrap code lines)</option>
            <option value="off">Off (Horizontal scrolling)</option>
          </select>
        </div>

        {/* UI Density */}
        <div className="space-y-1.5">
          <label className="font-semibold text-theme-text">Interface Density</label>
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value as "comfortable" | "compact")}
            className="w-full px-3 py-1.5 rounded-lg border border-theme-border bg-theme-bg-secondary text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-accent"
          >
            <option value="comfortable">Comfortable (Standard spacing)</option>
            <option value="compact">Compact (Tighter lists and padding)</option>
          </select>
        </div>

        {/* Reduced Motion */}
        <div className="space-y-1.5 flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="rounded border-theme-border accent-theme-accent"
            />
            <span className="font-semibold text-theme-text">Reduced Motion</span>
          </label>
          <p className="text-[11px] text-theme-text-muted">Disable non-essential animations</p>
        </div>
      </div>
    </div>
  );
};

