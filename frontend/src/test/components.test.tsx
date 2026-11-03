import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { MetricsCards } from "../components/dashboard/MetricsCards";
import { RequirementForm } from "../components/new-project/RequirementForm";

describe("UI Components & Forms", () => {
  it("renders Button states and handles clicks", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const btn = screen.getByText("Click Me");
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders Badge variants correctly", () => {
    const { rerender } = render(<Badge status="ready" />);
    expect(screen.getByText("Ready")).toBeInTheDocument();

    rerender(<Badge status="generating" />);
    expect(screen.getByText("Generating")).toBeInTheDocument();

    rerender(<Badge status="failed" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders accessible Modal and handles close on escape", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Dialog">
        <div>Modal Body Content</div>
      </Modal>
    );

    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("Modal Body Content")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders genuine MetricsCards without fabrication", () => {
    const mockMetrics = {
      total_projects: 5,
      ready_projects: 4,
      generating_projects: 0,
      failed_projects: 1,
      total_files: 22,
      total_lines_of_code: 1420,
      recent_activity: [],
      category_distribution: { Productivity: 3, Utilities: 2 },
    };

    render(<MetricsCards metrics={mockMetrics} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.getByText("1,420")).toBeInTheDocument();
  });

  it("submits RequirementForm with user inputs", () => {
    const handleSubmit = vi.fn();
    render(<RequirementForm onSubmit={handleSubmit} loading={false} />);

    const textarea = screen.getByPlaceholderText(/e\.g\. Build an interactive habit tracking application/i);
    fireEvent.change(textarea, { target: { value: "Build a modern task dashboard" } });

    const submitBtn = screen.getByText("Start Autonomous Generation");
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Build a modern task dashboard",
      })
    );
  });
});

