import React, { useState } from "react";
import { ThemePicker } from "../components/settings/ThemePicker";
import { AIConnectionTester } from "../components/settings/AIConnectionTester";
import { EditorSettings } from "../components/settings/EditorSettings";
import { StorageInfo } from "../components/settings/StorageInfo";
import { OnboardingModal } from "../components/settings/OnboardingModal";
import { Button } from "../components/common/Button";
import { HelpCircle } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-theme-text tracking-tight">System Settings & Preferences</h2>
          <p className="text-xs text-theme-text-muted mt-0.5">
            Configure visual themes, AI connectivity, editor environment, and local storage parameters.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOnboardingOpen(true)}
          icon={<HelpCircle className="w-4 h-4 text-theme-accent" />}
        >
          View Onboarding Tour
        </Button>
      </div>

      {/* Visual Theme Picker */}
      <ThemePicker />

      {/* Gemini Connectivity */}
      <AIConnectionTester />

      {/* Editor & Typography */}
      <EditorSettings />

      {/* Local Storage Details */}
      <StorageInfo />

      {/* Onboarding Dialog */}
      <OnboardingModal isOpen={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </div>
  );
};
