import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  FolderGit2,
  Sparkles,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Cpu,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../services/api";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { theme } = useTheme();
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    api.getHealth()
      .then((data) => setGeminiConfigured(data.gemini_configured))
      .catch(() => setGeminiConfigured(false));
  }, []);

  const navItems = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    { to: "/new", label: "New Project", icon: <PlusCircle className="w-5 h-5 shrink-0" /> },
    { to: "/projects", label: "My Projects", icon: <FolderGit2 className="w-5 h-5 shrink-0" /> },
    { to: "/playground", label: "AI Playground", icon: <Sparkles className="w-5 h-5 shrink-0" /> },
    { to: "/settings", label: "Settings", icon: <Settings className="w-5 h-5 shrink-0" /> },
    { to: "/docs", label: "Documentation", icon: <BookOpen className="w-5 h-5 shrink-0" /> },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between border-r border-theme-border bg-theme-bg-sidebar transition-all duration-200 select-none z-30 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between h-14 px-3.5 border-b border-theme-border">
          <NavLink to="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-theme-accent text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              ⚡
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-theme-text leading-tight">
                  AutoDevAI
                </span>
                <span className="text-[10px] text-theme-text-muted font-medium">
                  Autonomous Agent
                </span>
              </div>
            )}
          </NavLink>
          <button
            onClick={onToggle}
            className="p-1 rounded-md text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-tertiary transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-theme-accent text-white shadow-sm font-semibold"
                    : "text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-secondary"
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-theme-border text-xs">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-theme-text-muted">
              <span>Theme:</span>
              <span className="capitalize font-semibold text-theme-text">{theme.replace("-", " ")}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-theme-bg-secondary border border-theme-border">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-theme-accent" />
                <span className="font-medium text-[11px]">Gemini AI</span>
              </div>
              {geminiConfigured ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium" title="Deterministic fallback active">
                  <AlertCircle className="w-3 h-3" /> Test Mode
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`AI Status: ${geminiConfigured ? "Connected" : "Test Mode"}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${geminiConfigured ? "bg-emerald-500" : "bg-amber-500"}`} />
          </div>
        )}
      </div>
    </aside>
  );
};

