import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Save,
  RotateCcw,
  X,
  FileCode,
  WrapText,
  ZoomIn,
  ZoomOut,
  Check,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../common/Button";

interface CodeEditorProps {
  openFiles: string[];
  activeFile: string | null;
  fileContent: string;
  isDirty: boolean;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onChangeContent: (content: string) => void;
  onSave: () => void;
  onRevert: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  openFiles,
  activeFile,
  fileContent,
  isDirty,
  onSelectTab,
  onCloseTab,
  onChangeContent,
  onSave,
  onRevert,
}) => {
  const { theme, editorTheme, editorFontSize, setEditorFontSize, editorWordWrap, setEditorWordWrap } = useTheme();
  const [monacoFailed, setMonacoFailed] = useState(false);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty) onSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, onSave]);

  const getLanguage = (path: string | null) => {
    if (!path) return "plaintext";
    const ext = path.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "html":
      case "htm":
        return "html";
      case "css":
        return "css";
      case "js":
      case "mjs":
        return "javascript";
      case "json":
        return "json";
      case "md":
        return "markdown";
      case "ts":
      case "tsx":
        return "typescript";
      default:
        return "plaintext";
    }
  };

  if (!activeFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-theme-bg-secondary text-theme-text-muted p-8 text-center select-none">
        <FileCode className="w-12 h-12 mb-3 opacity-40 text-theme-accent" />
        <h4 className="text-base font-semibold text-theme-text">No File Selected</h4>
        <p className="text-xs mt-1 max-w-xs">
          Select a file from the explorer on the left or create a new file to start editing.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-theme-bg-card border-r border-theme-border overflow-hidden">
      {/* Editor Tabs Header */}
      <div className="flex items-center justify-between border-b border-theme-border bg-theme-bg-secondary px-2 overflow-x-auto">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {openFiles.map((path) => {
            const isActive = activeFile === path;
            const fileName = path.split("/").pop() || path;
            return (
              <div
                key={path}
                onClick={() => onSelectTab(path)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer border-t-2 transition-all ${
                  isActive
                    ? "bg-theme-bg-card border-theme-accent text-theme-text font-semibold shadow-sm"
                    : "border-transparent text-theme-text-muted hover:bg-theme-bg-tertiary"
                }`}
              >
                <span>{fileName}</span>
                {isActive && isDirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved edits" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(path);
                  }}
                  className="p-0.5 rounded hover:bg-black/10 text-theme-text-muted hover:text-theme-text"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Editor Controls Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0 py-1 pl-2">
          {/* Status Indicator */}
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              isDirty
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            }`}
          >
            {isDirty ? (
              <>● Unsaved</>
            ) : (
              <>
                <Check className="w-3 h-3" /> Saved
              </>
            )}
          </span>

          {/* Word Wrap Toggle */}
          <button
            onClick={() => setEditorWordWrap(editorWordWrap === "on" ? "off" : "on")}
            className={`p-1.5 rounded text-xs transition-colors ${
              editorWordWrap === "on"
                ? "bg-theme-accent/15 text-theme-accent font-semibold"
                : "text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-tertiary"
            }`}
            title={`Toggle word wrap (currently ${editorWordWrap})`}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          {/* Font Size Adjust */}
          <button
            onClick={() => setEditorFontSize(Math.max(10, editorFontSize - 1))}
            className="p-1.5 rounded text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-tertiary transition-colors"
            title="Decrease font size"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-theme-text-muted">{editorFontSize}px</span>
          <button
            onClick={() => setEditorFontSize(Math.min(24, editorFontSize + 1))}
            className="p-1.5 rounded text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-tertiary transition-colors"
            title="Increase font size"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Revert Button */}
          {isDirty && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onRevert}
              icon={<RotateCcw className="w-3 h-3" />}
              title="Discard unsaved changes"
            >
              Revert
            </Button>
          )}

          {/* Save Button */}
          <Button
            size="sm"
            variant="primary"
            disabled={!isDirty}
            onClick={onSave}
            icon={<Save className="w-3 h-3" />}
            title="Save changes (Ctrl+S)"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 relative">
        {!monacoFailed ? (
          <Editor
            height="100%"
            path={activeFile}
            language={getLanguage(activeFile)}
            value={fileContent}
            theme={editorTheme}
            onChange={(val) => onChangeContent(val || "")}
            options={{
              fontSize: editorFontSize,
              wordWrap: editorWordWrap,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              formatOnPaste: true,
              lineNumbers: "on",
            }}
            loading={
              <div className="h-full flex items-center justify-center text-xs text-theme-text-muted">
                Loading code editor...
              </div>
            }
            onMount={() => setMonacoFailed(false)}
          />
        ) : (
          <textarea
            value={fileContent}
            onChange={(e) => onChangeContent(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm bg-theme-bg-card text-theme-text border-none outline-none resize-none"
            style={{ fontSize: `${editorFontSize}px` }}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
};

