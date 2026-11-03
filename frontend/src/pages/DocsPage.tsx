import React from "react";
import { BookOpen, Layers, ShieldCheck, Terminal, Cpu, Keyboard } from "lucide-react";

export const DocsPage: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 text-theme-text">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-theme-accent" />
          AutoDevAI Documentation & Architecture
        </h2>
        <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">
          Comprehensive developer guide for the autonomous generative AI coding agent system.
        </p>
      </div>

      {/* Architecture Overview */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold flex items-center gap-2 border-b border-theme-border pb-2">
          <Layers className="w-4 h-4 text-theme-accent" />
          1. System Architecture
        </h3>
        <p className="text-xs text-theme-text-muted leading-relaxed">
          AutoDevAI follows a clean client-server architecture:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-xl border border-theme-border bg-theme-bg-card">
            <h4 className="font-bold text-theme-accent mb-1">Frontend Layer</h4>
            <p className="text-theme-text-muted">
              Built with React 19, TypeScript, Vite, React Router, and Tailwind CSS. Features 7 dynamic theme token palettes, Monaco code editor, and live sandboxed iframe preview.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-theme-border bg-theme-bg-card">
            <h4 className="font-bold text-theme-accent mb-1">Backend Agent Engine</h4>
            <p className="text-theme-text-muted">
              Built with Python, FastAPI, and Pydantic. Coordinates the 6-stage autonomous code synthesis pipeline, repair loops, code validators, and zip packaging.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-theme-border bg-theme-bg-card">
            <h4 className="font-bold text-theme-accent mb-1">Storage & AI</h4>
            <p className="text-theme-text-muted">
              Local filesystem persistence with atomic writes for metadata and source files. Powered by Google Gemini 2.5 Flash via the official Google Gen AI SDK.
            </p>
          </div>
        </div>
      </section>

      {/* Autonomous Pipeline */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold flex items-center gap-2 border-b border-theme-border pb-2">
          <Cpu className="w-4 h-4 text-theme-accent" />
          2. The 6-Stage Autonomous Agent Pipeline
        </h3>
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-lg bg-theme-bg-secondary border border-theme-border flex items-start gap-2">
            <span className="font-bold text-theme-accent">Stage 1:</span>
            <span><strong>Requirement Analysis:</strong> Extracts functional requirements, UI design style, color scheme, and interaction paradigms from natural language.</span>
          </div>
          <div className="p-3 rounded-lg bg-theme-bg-secondary border border-theme-border flex items-start gap-2">
            <span className="font-bold text-theme-accent">Stage 2:</span>
            <span><strong>Task & Architecture Planning:</strong> Synthesizes a multi-file dependency plan mapping files to specific responsibilities.</span>
          </div>
          <div className="p-3 rounded-lg bg-theme-bg-secondary border border-theme-border flex items-start gap-2">
            <span className="font-bold text-theme-accent">Stage 3:</span>
            <span><strong>Source Code Generation:</strong> Generates complete, functional code without empty stubs or placeholder buttons.</span>
          </div>
          <div className="p-3 rounded-lg bg-theme-bg-secondary border border-theme-border flex items-start gap-2">
            <span className="font-bold text-theme-accent">Stage 4:</span>
            <span><strong>Code Validation:</strong> Verifies HTML5 structure, CSS syntax, balanced JavaScript braces, and ensures referenced local stylesheets/scripts exist.</span>
          </div>
          <div className="p-3 rounded-lg bg-theme-bg-secondary border border-theme-border flex items-start gap-2">
            <span className="font-bold text-theme-accent">Stage 5:</span>
            <span><strong>Targeted Repair Loop:</strong> If validation detects syntax defects, engages the AI repair loop up to 3 bounded iterations.</span>
          </div>
          <div className="p-3 rounded-lg bg-theme-bg-secondary border border-theme-border flex items-start gap-2">
            <span className="font-bold text-theme-accent">Stage 6:</span>
            <span><strong>Verification & Persistence:</strong> Atomically writes files, updates project statistics, and logs activity to disk.</span>
          </div>
        </div>
      </section>

      {/* Security Controls */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold flex items-center gap-2 border-b border-theme-border pb-2">
          <ShieldCheck className="w-4 h-4 text-theme-accent" />
          3. Security Controls & Sandboxing
        </h3>
        <ul className="list-disc list-inside text-xs text-theme-text-muted space-y-1.5 leading-relaxed">
          <li><strong>Canonical Path Validation:</strong> File operations strictly reject path traversal attempts (e.g. <code>../</code> or null bytes <code>\0</code>).</li>
          <li><strong>Atomic Writes:</strong> Metadata and source code are staged in temporary files and replaced atomically to prevent corrupted files.</li>
          <li><strong>Iframe Preview Sandboxing:</strong> Preview renders within an isolated iframe enforcing strict <code>Content-Security-Policy</code> headers preventing access to backend API tokens or parent origin cookies.</li>
          <li><strong>No Shell Execution:</strong> The backend never executes arbitrary host commands from natural language requests.</li>
          <li><strong>Secret Redaction:</strong> Environment secrets and API keys are strictly redacted from logs and never exposed to the client.</li>
        </ul>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold flex items-center gap-2 border-b border-theme-border pb-2">
          <Keyboard className="w-4 h-4 text-theme-accent" />
          4. Keyboard Shortcuts
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-theme-border">
            <thead className="bg-theme-bg-secondary border-b border-theme-border">
              <tr>
                <th className="p-2.5 font-semibold">Shortcut</th>
                <th className="p-2.5 font-semibold">Scope</th>
                <th className="p-2.5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              <tr>
                <td className="p-2.5 font-mono text-theme-accent">Ctrl + S / ⌘ + S</td>
                <td className="p-2.5">Editor</td>
                <td className="p-2.5">Save current active file & trigger re-validation</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-theme-accent">Escape</td>
                <td className="p-2.5">Global</td>
                <td className="p-2.5">Dismiss modal dialogs and dropdown menus</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

