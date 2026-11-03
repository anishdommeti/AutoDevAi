import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Sidebar } from "./components/common/Sidebar";
import { Navbar } from "./components/common/Navbar";
import { ToastContainer } from "./components/common/ToastContainer";

import { DashboardPage } from "./pages/DashboardPage";
import { NewProjectPage } from "./pages/NewProjectPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { AIPlaygroundPage } from "./pages/AIPlaygroundPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DocsPage } from "./pages/DocsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const AppContent: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-theme-bg text-theme-text">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/new" element={<NewProjectPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/workspace/:projectId" element={<WorkspacePage />} />
            <Route path="/playground" element={<AIPlaygroundPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
