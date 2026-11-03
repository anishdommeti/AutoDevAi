import React, { createContext, useContext, useState, useCallback } from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  notify: (type: NotificationType, title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback((type: NotificationType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      dismiss(id);
    }, 4000);
  }, [dismiss]);

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

