import React, { useState, useEffect, useRef } from "react";
import { RequirementForm, ProjectFormData } from "../components/new-project/RequirementForm";
import { GenerationProgressView } from "../components/new-project/GenerationProgressView";
import { api } from "../services/api";
import { GenerationStatusResponse, ProjectMetadata } from "../services/types";
import { useNotification } from "../context/NotificationContext";

export const NewProjectPage: React.FC = () => {
  const { notify } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [currentProject, setCurrentProject] = useState<ProjectMetadata | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatusResponse | null>(null);
  const pollingRef = useRef<number | null>(null);

  // Clean polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const pollStatus = (projectId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = window.setInterval(async () => {
      try {
        const res = await api.getGenerationStatus(projectId);
        setGenerationStatus(res);

        if (res.status === "completed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          notify("success", "Application Generated", "All files synthesized and validated successfully!");
        } else if (res.status === "failed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          notify("error", "Generation Failed", res.error || "Agent encountered an issue");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 800);
  };

  const handleStartGeneration = async (data: ProjectFormData) => {
    setSubmitting(true);
    try {
      // 1. Create project metadata
      const project = await api.createProject({
        name: data.name,
        description: data.prompt,
        category: data.category,
        target_output: data.target_output,
        design_style: data.design_style,
        color_scheme: data.color_scheme,
      });

      setCurrentProject(project);

      // 2. Start autonomous generation
      const initialStatus = await api.startGeneration(project.id, {
        prompt: data.prompt,
        category: data.category,
        design_style: data.design_style,
        color_scheme: data.color_scheme,
        additional_instructions: data.additional_instructions,
      });

      setGenerationStatus(initialStatus);
      notify("info", "Autonomous Agent Started", `Analyzing requirements for '${project.name}'...`);

      // 3. Poll for progress
      pollStatus(project.id);
    } catch (err: any) {
      notify("error", "Failed to start generation", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (!currentProject) return;
    try {
      const res = await api.retryGeneration(currentProject.id);
      setGenerationStatus(res);
      notify("info", "Retrying Generation", "Autonomous agent restarted.");
      pollStatus(currentProject.id);
    } catch (err: any) {
      notify("error", "Retry failed", err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {!generationStatus ? (
        <>
          <div className="text-center max-w-2xl mx-auto mb-4">
            <h2 className="text-2xl font-bold text-theme-text tracking-tight">
              Create New Autonomous Project
            </h2>
            <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">
              Describe your application in plain English. AutoDevAI transforms natural-language requirements into clean multi-file source code, validates syntax and references, and prepares a live sandbox preview.
            </p>
          </div>

          <RequirementForm onSubmit={handleStartGeneration} loading={submitting} />
        </>
      ) : (
        <GenerationProgressView
          status={generationStatus}
          projectName={currentProject?.name || "Application"}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
};
