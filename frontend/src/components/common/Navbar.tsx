import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Palette, Plus, HelpCircle, Check, ChevronDown } from "lucide-react";
import { useTheme, THEMES, ThemeType } from "../../context/ThemeContext";
import { Button } from "./Button";

export const Navbar: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute breadcrumb title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Dashboard";
    if (path === "/new") return "New Project Generator";
    if (path === "/projects") return "My Projects";
    if (path.startsWith("/workspace")) return "Project Workspace IDE";
    if (path === "/playground") return "AI Agent Playground";
    if (path === "/settings") return "Settings & Preferences";
    if (path === "/docs") return "Documentation & Architecture";
    return "AutoDevAI";
  };

  return (
    <header className="h-14 border-b border-theme-border bg-theme-bg-secondary px-5 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-theme-text tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Picker Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-theme-border bg-theme-bg-card hover:bg-theme-bg-tertiary text-theme-text transition-colors shadow-sm"
            aria-label="Select theme"
          >
            <Palette className="w-3.5 h-3.5 text-theme-accent" />
            <span className="hidden sm:inline">Theme:</span>
            <span className="font-semibold capitalize">{theme.replace("-", " ")}</span>
            <ChevronDown className="w-3.5 h-3.5 text-theme-text-muted" />
          </button>

          {themeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 p-2 bg-theme-bg-card rounded-xl border border-theme-border shadow-xl z-50 animate-fade-in">
              <div className="px-2 py-1 mb-1 border-b border-theme-border text-[11px] font-semibold text-theme-text-muted uppercase tracking-wider">
                Select Visual Theme (7 Available)
              </div>
              <div className="space-y-1">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      theme === t.id
                        ? "bg-theme-accent text-white font-medium shadow-sm"
                        : "hover:bg-theme-bg-secondary text-theme-text"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Theme color chip */}
                      <div
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-inner flex items-center justify-center"
                        style={{ backgroundColor: t.previewColors.bg }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: t.previewColors.accent }}
                        />
                      </div>
                      <div className="text-left">
                        <div className="leading-tight">{t.name}</div>
                      </div>
                    </div>
                    {theme === t.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Documentation Link */}
        <Link
          to="/docs"
          className="p-1.5 text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-card rounded-lg transition-colors"
          title="Help & Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </Link>

        {/* Quick New Project Button */}
        {location.pathname !== "/new" && (
          <Link to="/new">
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
              Create Project
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

