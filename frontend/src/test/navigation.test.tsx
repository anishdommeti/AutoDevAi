import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "../components/common/Sidebar";
import { Navbar } from "../components/common/Navbar";
import { ThemeProvider } from "../context/ThemeContext";
import { NotificationProvider } from "../context/NotificationContext";

// Mock fetch for API health
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ status: "healthy", gemini_configured: false, gemini_model: "gemini-2.5-flash" }),
  })
);

describe("Application Shell & Navigation", () => {
  it("renders sidebar with all primary sections", () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
            <Sidebar collapsed={false} onToggle={() => {}} />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("AutoDevAI")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("New Project")).toBeInTheDocument();
    expect(screen.getByText("My Projects")).toBeInTheDocument();
    expect(screen.getByText("AI Playground")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Documentation")).toBeInTheDocument();
  });

  it("renders navbar with theme selector trigger", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ThemeProvider>
          <NotificationProvider>
            <Navbar />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Theme:/i)).toBeInTheDocument();
  });
});

