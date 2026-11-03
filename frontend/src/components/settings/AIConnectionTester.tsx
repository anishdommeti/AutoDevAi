import React, { useState } from "react";
import { Cpu, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { api } from "../../services/api";
import { ConnectionTestResponse } from "../../services/types";
import { Button } from "../common/Button";

export const AIConnectionTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionTestResponse | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await api.testGeminiConnection();
      setResult(res);
    } catch (err: any) {
      setResult({
        success: false,
        model: "Unknown",
        message: err.message || "Failed to reach backend API",
        error_details: "Network or Server Error",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-theme-border bg-theme-bg-card shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-theme-text flex items-center gap-2">
            <Cpu className="w-4 h-4 text-theme-accent" />
            Google Gemini API Connectivity
          </h4>
          <p className="text-xs text-theme-text-muted mt-0.5">
            AutoDevAI uses the Google Gen AI Python SDK. Click below to verify live model ping and latency.
          </p>
        </div>

        <Button
          onClick={handleTest}
          loading={testing}
          size="sm"
          icon={<Sparkles className="w-3.5 h-3.5" />}
        >
          Test Gemini Connection
        </Button>
      </div>

      {result && (
        <div
          className={`p-3.5 rounded-lg border text-xs animate-fade-in ${
            result.success
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {result.success ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{result.message}</span>
          </div>

          <div className="mt-2 text-[11px] opacity-90 space-y-1">
            <div>
              <span className="font-semibold">Model:</span> {result.model}
            </div>
            {result.latency_ms !== undefined && (
              <div>
                <span className="font-semibold">Latency:</span> {result.latency_ms} ms
              </div>
            )}
            {result.error_details && (
              <div>
                <span className="font-semibold">Note:</span> {result.error_details}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

