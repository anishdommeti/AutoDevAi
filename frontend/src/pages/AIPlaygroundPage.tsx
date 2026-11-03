import React, { useState } from "react";
import { Sparkles, Send, Terminal } from "lucide-react";
import { api } from "../services/api";
import { Button } from "../components/common/Button";
import { useNotification } from "../context/NotificationContext";

export const AIPlaygroundPage: React.FC = () => {
  const { notify } = useNotification();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("component");

  const presets = [
    {
      id: "component",
      title: "Synthesize Component",
      prompt: "Generate an accessible, responsive tabs component using vanilla HTML, CSS variables, and modern ES6 JavaScript.",
    },
    {
      id: "refactor",
      title: "Code Optimization",
      prompt: "Show how to implement a clean debounce function in vanilla JS with cancellation and immediate execution options.",
    },
    {
      id: "regex",
      title: "Regex & Validation",
      prompt: "Provide an RFC 5322 compliant email validation regex with an explanation of each token capture group.",
    },
    {
      id: "css-grid",
      title: "CSS Grid Layout",
      prompt: "Generate a responsive dashboard grid CSS layout that supports 4 columns on desktop, 2 on tablet, and 1 on mobile without media query bloat (using repeat(auto-fit, minmax(...))).",
    },
  ];

  const handleRun = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await api.chatAI({
        message: prompt,
      });
      setResponse(res.reply);
      notify("success", "AI Generation Finished", "Response received from agent.");
    } catch (err: any) {
      notify("error", "AI Playground Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-theme-text tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-theme-accent" />
          AI Agent Playground
        </h2>
        <p className="text-xs text-theme-text-muted mt-0.5">
          Experiment directly with Gemini prompt engineering, prototype code snippets, and inspect raw agent responses.
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-theme-text-muted uppercase tracking-wider">
          Quick Prompts
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPreset(p.id);
                setPrompt(p.prompt);
              }}
              className={`p-3 rounded-xl border text-left text-xs transition-all ${
                prompt === p.prompt
                  ? "border-theme-accent bg-theme-bg-secondary text-theme-text font-medium shadow-sm"
                  : "border-theme-border bg-theme-bg-card hover:bg-theme-bg-secondary text-theme-text-muted hover:text-theme-text"
              }`}
            >
              <div className="font-semibold text-theme-text">{p.title}</div>
              <div className="text-[11px] text-theme-text-muted mt-1 truncate">{p.prompt}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Editor */}
      <div className="p-5 rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm space-y-3">
        <label className="block text-xs font-semibold text-theme-text">Prompt / Instruction</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask programming questions or instruct the agent to generate custom algorithms or layouts..."
          rows={4}
          className="w-full p-3 text-xs rounded-xl border border-theme-border bg-theme-bg-secondary text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-1 focus:ring-theme-accent resize-none font-mono"
        />

        <div className="flex justify-between items-center pt-2">
          <span className="text-[11px] text-theme-text-muted">
            Engine: Gemini 2.5 Flash with Autonomous Prompt Structure
          </span>
          <Button
            onClick={handleRun}
            loading={loading}
            disabled={!prompt.trim()}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Execute Prompt
          </Button>
        </div>
      </div>

      {/* Response Box */}
      {response && (
        <div className="p-5 rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm space-y-2 animate-fade-in">
          <div className="flex items-center justify-between border-b border-theme-border pb-2 text-xs">
            <span className="font-semibold text-theme-text flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-theme-accent" />
              Agent Response
            </span>
            <span className="text-theme-text-muted text-[11px]">Markdown Formatted</span>
          </div>
          <div className="p-4 rounded-xl bg-theme-bg-secondary text-xs text-theme-text font-mono whitespace-pre-wrap select-text leading-relaxed">
            {response}
          </div>
        </div>
      )}
    </div>
  );
};
