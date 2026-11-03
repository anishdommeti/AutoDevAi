import React from "react";
import { useNotification, NotificationItem } from "../../context/NotificationContext";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { notifications, dismiss } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ item: NotificationItem; onDismiss: () => void }> = ({ item, onDismiss }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
  };

  return (
    <div
      className="pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-lg shadow-lg border border-theme-border bg-theme-bg-card text-theme-text transition-all duration-200 animate-slide-in"
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        {icons[item.type]}
        <div>
          <h4 className="text-sm font-semibold leading-tight">{item.title}</h4>
          {item.message && <p className="text-xs text-theme-text-muted mt-0.5 leading-normal">{item.message}</p>}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-theme-text-muted hover:text-theme-text p-1 rounded transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

