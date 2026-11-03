import React from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Sparkles, FolderCode } from "lucide-react";
import { Button } from "../common/Button";

export const EmptyState: React.FC<{ onStartTemplate?: (template: any) => void }> = () => {
  return (
    <div className="py-16 px-6 text-center rounded-2xl border-2 border-dashed border-theme-border bg-theme-bg-card/50 max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-theme-accent/10 border border-theme-accent/20 text-theme-accent flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
        <Sparkles className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-theme-text mb-2">
        Welcome to AutoDevAI Workspace
      </h3>
      <p className="text-sm text-theme-text-muted max-w-md mx-auto mb-6 leading-relaxed">
        You don't have any projects yet. Describe an application in natural language, and AutoDevAI will plan, generate, validate, and preview it autonomously.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/new">
          <Button size="lg" icon={<PlusCircle className="w-4 h-4" />}>
            Create Your First Project
          </Button>
        </Link>
        <Link to="/docs">
          <Button variant="outline" size="lg">
            Read System Guide
          </Button>
        </Link>
      </div>
    </div>
  );
};

