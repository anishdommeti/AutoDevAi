import React from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Sparkles, Terminal, Code2, Eye, Download, CheckCircle2 } from "lucide-react";

export const OnboardingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const steps = [
    {
      icon: <Sparkles className="w-5 h-5 text-theme-accent" />,
      title: "1. Natural Language Requirements",
      description: "Describe any web application. AutoDevAI analyzes your prompt, categories, and design style into structured specifications.",
    },
    {
      icon: <Terminal className="w-5 h-5 text-sky-500" />,
      title: "2. Autonomous Multi-File Generation",
      description: "The AI agent plans and synthesizes semantic HTML5, modern CSS design tokens, and stateful ES6 JavaScript files without placeholders.",
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      title: "3. Validation & Targeted Repair Loop",
      description: "Every file passes through automated syntax, tag closure, and local reference checks before it is finalized.",
    },
    {
      icon: <Eye className="w-5 h-5 text-purple-500" />,
      title: "4. Live Sandboxed Preview & IDE",
      description: "Inspect the live rendering in responsive desktop/tablet/mobile viewports, edit code in Monaco, and chat with the AI assistant.",
    },
    {
      icon: <Download className="w-5 h-5 text-amber-500" />,
      title: "5. Production ZIP Export",
      description: "Download a clean, self-contained ZIP archive containing all verified source files and documentation.",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome to AutoDevAI"
      description="Autonomous Coding Agent Using Generative AI"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl border border-theme-border bg-theme-bg-secondary text-xs"
            >
              <div className="p-2 rounded-lg bg-theme-bg-card border border-theme-border shrink-0">
                {step.icon}
              </div>
              <div>
                <h4 className="font-bold text-theme-text text-sm">{step.title}</h4>
                <p className="text-theme-text-muted mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <Button size="md" onClick={onClose}>
            Get Started
          </Button>
        </div>
      </div>
    </Modal>
  );
};

