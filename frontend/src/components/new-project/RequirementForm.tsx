import React, { useState } from "react";
import { Sparkles, Layers, Palette, Monitor, Info, ArrowRight } from "lucide-react";
import { Button } from "../common/Button";

export interface ProjectFormData {
  name: string;
  prompt: string;
  category: string;
  target_output: string;
  design_style: string;
  color_scheme: string;
  additional_instructions: string;
}

interface RequirementFormProps {
  onSubmit: (data: ProjectFormData) => void;
  loading: boolean;
}

const TEMPLATES = [
  {
    title: "Kanban Task Board",
    category: "Productivity",
    prompt: "Build an interactive Kanban board application with draggable or selectable columns (To Do, In Progress, Done), task creation, priority labels, search filtering, and local storage persistence.",
    style: "Modern Developer Tool",
    color: "Slate & Indigo",
  },
  {
    title: "Expense & Budget Tracker",
    category: "Utilities",
    prompt: "Build a personal expense and budget tracker with income/expense logging, category breakdown, balance summary cards, transaction history, and dark mode.",
    style: "Vibrant SaaS",
    color: "Midnight Cyan",
  },
  {
    title: "Markdown Knowledge Hub",
    category: "Productivity",
    prompt: "Build a markdown note-taking workspace with live preview, document tagging, auto-save to browser storage, export options, and responsive sidebar navigation.",
    style: "Minimalist",
    color: "Monochrome Charcoal",
  },
  {
    title: "Analytics & Data Dashboard",
    category: "Dashboard",
    prompt: "Build an interactive analytics dashboard featuring summary metrics, metric filters, time-range selectors, responsive data cards, and real-time calculation controls.",
    style: "Corporate Clean",
    color: "Emerald Forest",
  },
];

export const RequirementForm: React.FC<RequirementFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    prompt: "",
    category: "Productivity",
    target_output: "HTML/CSS/JavaScript",
    design_style: "Modern Developer Tool",
    color_scheme: "Slate & Indigo",
    additional_instructions: "",
  });

  const handleApplyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setFormData((prev) => ({
      ...prev,
      name: tmpl.title,
      prompt: tmpl.prompt,
      category: tmpl.category,
      design_style: tmpl.style,
      color_scheme: tmpl.color,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prompt.trim()) return;
    
    // Auto name if empty
    const resolvedName = formData.name.trim() || formData.prompt.slice(0, 30).trim() + " App";
    onSubmit({ ...formData, name: resolvedName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Starter Templates */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-theme-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
          Quick Starters (Click to pre-fill)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.title}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              className="p-3 text-left rounded-xl border border-theme-border bg-theme-bg-card hover:border-theme-accent hover:bg-theme-bg-secondary transition-all shadow-sm group"
            >
              <div className="font-semibold text-xs text-theme-text group-hover:text-theme-accent transition-colors">
                {tmpl.title}
              </div>
              <div className="text-[11px] text-theme-text-muted mt-1 line-clamp-2">
                {tmpl.prompt}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Requirement Input */}
      <div className="p-6 rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm space-y-4">
        <div>
          <label htmlFor="promptInput" className="block text-sm font-semibold text-theme-text mb-1.5">
            What do you want to build? <span className="text-theme-accent">*</span>
          </label>
          <p className="text-xs text-theme-text-muted mb-2">
            Describe your application's features, workflow, layout, and behaviors in natural language.
          </p>
          <textarea
            id="promptInput"
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            placeholder="e.g. Build an interactive habit tracking application with daily streaks, category tags, weekly completion statistics, motivational quotes, and persistent browser storage."
            rows={5}
            required
            className="w-full p-3.5 text-sm rounded-xl border border-theme-border bg-theme-bg-secondary text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent transition-all resize-none"
          />
        </div>

        {/* Project Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label htmlFor="nameInput" className="block text-xs font-semibold text-theme-text mb-1">
              Project Name (Optional)
            </label>
            <input
              id="nameInput"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Habit Tracker Pro"
              className="w-full px-3 py-2 text-sm rounded-lg border border-theme-border bg-theme-bg-secondary text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
            />
          </div>

          <div>
            <label htmlFor="categorySelect" className="block text-xs font-semibold text-theme-text mb-1">
              Application Category
            </label>
            <select
              id="categorySelect"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-theme-border bg-theme-bg-secondary text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
            >
              <option value="Productivity">Productivity & Task Management</option>
              <option value="Dashboard">Analytics & Data Dashboard</option>
              <option value="Utilities">Utilities & Tools</option>
              <option value="Educational">Educational & Quiz</option>
              <option value="E-Commerce">E-Commerce & Catalog</option>
              <option value="Entertainment">Creative & Entertainment</option>
            </select>
          </div>

          <div>
            <label htmlFor="designStyleSelect" className="block text-xs font-semibold text-theme-text mb-1">
              Design Style
            </label>
            <select
              id="designStyleSelect"
              value={formData.design_style}
              onChange={(e) => setFormData({ ...formData, design_style: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-theme-border bg-theme-bg-secondary text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
            >
              <option value="Modern Developer Tool">Modern Developer Tool</option>
              <option value="Minimalist">Clean Minimalist</option>
              <option value="Vibrant SaaS">Vibrant Modern SaaS</option>
              <option value="Corporate Clean">Enterprise Corporate Clean</option>
              <option value="Terminal Dark">Terminal Dark & Retro</option>
            </select>
          </div>

          <div>
            <label htmlFor="colorSchemeSelect" className="block text-xs font-semibold text-theme-text mb-1">
              Color Palette
            </label>
            <select
              id="colorSchemeSelect"
              value={formData.color_scheme}
              onChange={(e) => setFormData({ ...formData, color_scheme: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-theme-border bg-theme-bg-secondary text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
            >
              <option value="Slate & Indigo">Slate & Indigo</option>
              <option value="Midnight Cyan">Midnight Cyan</option>
              <option value="Emerald Forest">Emerald Forest</option>
              <option value="Monochrome Charcoal">Monochrome Charcoal</option>
              <option value="Warm Amber">Warm Amber & Stone</option>
            </select>
          </div>
        </div>

        {/* Additional Instructions */}
        <div className="pt-2">
          <label htmlFor="additionalInput" className="block text-xs font-semibold text-theme-text mb-1">
            Additional Constraints or Instructions (Optional)
          </label>
          <input
            id="additionalInput"
            type="text"
            value={formData.additional_instructions}
            onChange={(e) => setFormData({ ...formData, additional_instructions: e.target.value })}
            placeholder="e.g. Include sound effects using Web Audio API, or add filter buttons for tags"
            className="w-full px-3 py-2 text-sm rounded-lg border border-theme-border bg-theme-bg-secondary text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
          />
        </div>

        {/* Submit Bar */}
        <div className="pt-4 border-t border-theme-border flex items-center justify-between">
          <span className="text-xs text-theme-text-muted flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-theme-accent" />
            Target: Pure HTML5 + CSS3 + ES6 Modules
          </span>

          <Button
            type="submit"
            size="lg"
            loading={loading}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Start Autonomous Generation
          </Button>
        </div>
      </div>
    </form>
  );
};

