import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Search,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { ProjectFile } from "../../services/types";

interface FileTreeProps {
  files: ProjectFile[];
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
  onDeleteFile: (path: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFile,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
}) => {
  const [search, setSearch] = useState("");
  const [newFileInputOpen, setNewFileInputOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName("");
    setNewFileInputOpen(false);
  };

  const getFileIcon = (ext?: string) => {
    switch (ext?.toLowerCase()) {
      case "html":
      case "htm":
        return <FileCode className="w-4 h-4 text-orange-500 shrink-0" />;
      case "css":
        return <FileCode className="w-4 h-4 text-sky-500 shrink-0" />;
      case "js":
      case "mjs":
        return <FileCode className="w-4 h-4 text-yellow-500 shrink-0" />;
      case "json":
        return <FileJson className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "md":
        return <FileText className="w-4 h-4 text-purple-400 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-theme-text-muted shrink-0" />;
    }
  };

  const renderTree = (nodes: ProjectFile[]) => {
    return nodes
      .filter((n) => !search || n.name.toLowerCase().includes(search.toLowerCase()))
      .map((node) => {
        if (node.is_dir) {
          return <FolderNode key={node.path} node={node} activeFile={activeFile} onSelectFile={onSelectFile} onRenameFile={onRenameFile} onDeleteFile={onDeleteFile} />;
        }
        const isActive = activeFile === node.path;
        return (
          <div
            key={node.path}
            onClick={() => onSelectFile(node.path)}
            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
              isActive
                ? "bg-theme-accent text-white font-medium shadow-sm"
                : "text-theme-text hover:bg-theme-bg-secondary"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {getFileIcon(node.extension)}
              <span className="truncate">{node.name}</span>
            </div>

            <div className="hidden group-hover:flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newPath = prompt("Enter new filename or path:", node.path);
                  if (newPath && newPath !== node.path) onRenameFile(node.path, newPath);
                }}
                className="p-1 rounded hover:bg-black/20 text-current transition-colors"
                title="Rename file"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete file '${node.name}'?`)) onDeleteFile(node.path);
                }}
                className="p-1 rounded hover:bg-black/20 text-rose-300 hover:text-rose-100 transition-colors"
                title="Delete file"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      });
  };

  return (
    <div className="h-full flex flex-col bg-theme-bg-sidebar border-r border-theme-border text-theme-text select-none">
      {/* File Tree Toolbar */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">
          Explorer
        </span>
        <button
          onClick={() => setNewFileInputOpen(!newFileInputOpen)}
          className="p-1 rounded text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-tertiary transition-colors"
          title="New File"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-theme-border">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-theme-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-8 pr-2 py-1 text-xs rounded-md border border-theme-border bg-theme-bg-secondary text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-1 focus:ring-theme-accent"
          />
        </div>
      </div>

      {/* New File Input Row */}
      {newFileInputOpen && (
        <form onSubmit={handleCreate} className="p-2 border-b border-theme-border bg-theme-bg-secondary">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="filename.js (or path/file.css)"
            autoFocus
            className="w-full px-2 py-1 text-xs rounded border border-theme-accent bg-theme-bg-card text-theme-text focus:outline-none"
          />
          <div className="flex justify-end gap-1 mt-1.5">
            <button
              type="button"
              onClick={() => setNewFileInputOpen(false)}
              className="px-2 py-0.5 text-[10px] text-theme-text-muted hover:text-theme-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2 py-0.5 text-[10px] bg-theme-accent text-white rounded font-medium"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Nodes list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {files.length === 0 ? (
          <div className="text-center py-8 text-xs text-theme-text-muted">No files found</div>
        ) : (
          renderTree(files)
        )}
      </div>
    </div>
  );
};

const FolderNode: React.FC<{
  node: ProjectFile;
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
  onDeleteFile: (path: string) => void;
}> = ({ node, activeFile, onSelectFile, onRenameFile, onDeleteFile }) => {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-secondary rounded cursor-pointer transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        {open ? <FolderOpen className="w-4 h-4 text-theme-accent" /> : <Folder className="w-4 h-4 text-theme-accent" />}
        <span>{node.name}</span>
      </div>
      {open && node.children && (
        <div className="pl-3.5 ml-1 border-l border-theme-border/60 space-y-0.5 mt-0.5">
          {node.children.map((child) => (
            child.is_dir ? (
              <FolderNode
                key={child.path}
                node={child}
                activeFile={activeFile}
                onSelectFile={onSelectFile}
                onRenameFile={onRenameFile}
                onDeleteFile={onDeleteFile}
              />
            ) : (
              <div
                key={child.path}
                onClick={() => onSelectFile(child.path)}
                className={`flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                  activeFile === child.path
                    ? "bg-theme-accent text-white font-medium"
                    : "text-theme-text hover:bg-theme-bg-secondary"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{child.name}</span>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

