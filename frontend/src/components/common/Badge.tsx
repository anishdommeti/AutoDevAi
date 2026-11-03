import React from "react";
import { ProjectStatus } from "../../services/types";

export interface BadgeProps {
  status?: ProjectStatus | string;
  children?: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({ status, children, variant, size = "sm" }) => {
  let resolvedVariant = variant || "neutral";
  let label = children;

  if (status) {
    switch (status) {
      case "ready":
        resolvedVariant = "success";
        label = label || "Ready";
        break;
      case "generating":
        resolvedVariant = "warning";
        label = label || "Generating";
        break;
      case "failed":
        resolvedVariant = "error";
        label = label || "Failed";
        break;
      case "created":
      default:
        resolvedVariant = "info";
        label = label || "Created";
        break;
    }
  }

  const variants = {
    success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
    error: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
    info: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
    neutral: "bg-theme-bg-secondary text-theme-text-muted border-theme-border",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-sm font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variants[resolvedVariant]} ${sizes[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
};

