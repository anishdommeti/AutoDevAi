import React from "react";
import { Check } from "lucide-react";
import { useTheme, THEMES, ThemeType } from "../../context/ThemeContext";

export const ThemePicker: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-theme-text">Visual Appearance & Themes</h4>
        <p className="text-xs text-theme-text-muted mt-0.5">
          Select from 7 application-wide design token palettes. Every theme styles navigation, cards, modals, editor, and preview controls.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {THEMES.map((t) => {
          const isSelected = theme === t.id;
          return (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "border-theme-accent ring-2 ring-theme-accent/20 bg-theme-bg-secondary shadow-md"
                  : "border-theme-border bg-theme-bg-card hover:border-theme-border-strong hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {/* Theme Chip */}
                  <div
                    className="w-5 h-5 rounded-full border border-black/20 flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: t.previewColors.bg }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: t.previewColors.accent }}
                    />
                  </div>
                  <span className="text-xs font-bold text-theme-text">{t.name}</span>
                </div>
                {isSelected && (
                  <span className="p-1 rounded-full bg-theme-accent text-white">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>

              <p className="text-[11px] text-theme-text-muted mb-3 leading-tight min-h-[28px]">
                {t.description}
              </p>

              {/* Mini visual mockup bar */}
              <div
                className="h-6 rounded-md border flex items-center justify-between px-2 text-[9px] font-mono"
                style={{
                  backgroundColor: t.previewColors.bg,
                  borderColor: t.previewColors.border,
                  color: t.previewColors.text,
                }}
              >
                <span>Mock UI</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white"
                  style={{ backgroundColor: t.previewColors.accent }}
                >
                  Accent
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

