import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../components/common/Button";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-6 text-center text-theme-text select-none">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 text-2xl shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold mb-1">Page Not Found</h2>
      <p className="text-xs text-theme-text-muted max-w-sm mb-6">
        The route you are trying to access does not exist or may have been relocated.
      </p>
      <Link to="/">
        <Button icon={<ArrowLeft className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};

