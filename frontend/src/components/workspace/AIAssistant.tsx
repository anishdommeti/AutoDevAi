import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  FileCode,
  CheckCircle,
  HelpCircle,
  Bug,
  PlusCircle,
  Code,
} from "lucide-react";
import { AIChatMessage, FilePatch } from "../../services/types";
import { api } from "../../services/api";
import { Button } from "../common/Button";
import { useNotification } from "../../context/NotificationContext";

interface AIAssistantProps {
  projectId: string;
  activeFile: string | null;
  activeFileContent: string;
  onApplyPatches: (patches: FilePatch[]) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  projectId,
  activeFile,
  activeFileContent,
  onApplyPatches,
}) => {
  const { notify } = useNotification();
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: `Hello! I'm your AutoDevAI Assistant. I can help explain your project, diagnose bugs, or propose code modifications for **${activeFile || "any project file"}**.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: AIChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput("");
    setLoading(true);

    try {
      const response = await api.chatAI({
        project_id: projectId,
        message: textToSend,
        active_file: activeFile || undefined,
        active_file_content: activeFileContent || undefined,
        history: messages,
      });

      const assistantMsg: AIChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: "assistant",
        content: response.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If proposed changes exist, notify user
      if (response.proposed_changes && response.proposed_changes.length > 0) {
        notify("info", "AI Code Proposal Ready", `Received ${response.proposed_changes.length} file change(s)`);
      }
    } catch (err: any) {
      notify("error", "AI Request Failed", err.message || "Failed to communicate with assistant");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (!activeFile) {
      handleSend(`Please summarize the project architecture and main features.`);
      return;
    }

    if (action === "explain") {
      handleSend(`Explain the structure, functions, and role of '${activeFile}'.`);
    } else if (action === "bugs") {
      handleSend(`Inspect '${activeFile}' for any potential bugs, edge cases, or syntax problems.`);
    } else if (action === "feature") {
      handleSend(`Suggest and implement a new feature or interactive enhancement for '${activeFile}'.`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-theme-bg-card border-l border-theme-border text-theme-text select-none">
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between bg-theme-bg-secondary">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-theme-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-theme-text">
            AI Assistant
          </span>
        </div>
        {activeFile && (
          <span className="text-[11px] font-mono text-theme-text-muted px-2 py-0.5 rounded bg-theme-bg-tertiary">
            {activeFile.split("/").pop()}
          </span>
        )}
      </div>

      {/* Quick Context Actions */}
      <div className="p-2 border-b border-theme-border bg-theme-bg-secondary/50 flex flex-wrap gap-1.5">
        <button
          onClick={() => handleQuickAction("explain")}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-theme-bg-card border border-theme-border hover:bg-theme-bg-tertiary transition-colors"
        >
          <HelpCircle className="w-3 h-3 text-sky-500" /> Explain File
        </button>
        <button
          onClick={() => handleQuickAction("bugs")}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-theme-bg-card border border-theme-border hover:bg-theme-bg-tertiary transition-colors"
        >
          <Bug className="w-3 h-3 text-rose-500" /> Find Bugs
        </button>
        <button
          onClick={() => handleQuickAction("feature")}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-theme-bg-card border border-theme-border hover:bg-theme-bg-tertiary transition-colors"
        >
          <PlusCircle className="w-3 h-3 text-emerald-500" /> Add Feature
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 select-text">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col text-xs ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`p-3 rounded-xl max-w-[90%] leading-relaxed ${
                msg.role === "user"
                  ? "bg-theme-accent text-white"
                  : "bg-theme-bg-secondary border border-theme-border text-theme-text"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            <span className="text-[9px] text-theme-text-muted mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-theme-text-muted p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-theme-accent" />
            <span>Gemini is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2 border-t border-theme-border bg-theme-bg-secondary flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask programming questions or request changes..."
          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-theme-border bg-theme-bg-card text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-1 focus:ring-theme-accent"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!input.trim() || loading}
          icon={<Send className="w-3 h-3" />}
        >
          Send
        </Button>
      </form>
    </div>
  );
};

