import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme, THEMES } from "../context/ThemeContext";

const ThemeTestComponent = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      {THEMES.map((t) => (
        <button key={t.id} onClick={() => setTheme(t.id)}>
          Select {t.name}
        </button>
      ))}
    </div>
  );
};

describe("AutoDevAI Mandatory 7 Themes Engine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defines all 7 mandatory production themes", () => {
    const expectedIds = ["light", "dark", "midnight", "oled-black", "nord", "forest", "warm-sand"];
    const themeIds = THEMES.map((t) => t.id);
    expect(themeIds).toEqual(expectedIds);
  });

  it("updates theme and document data-theme attribute", () => {
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    const selectNordBtn = screen.getByText("Select Nord Arctic");
    fireEvent.click(selectNordBtn);

    expect(screen.getByTestId("current-theme").textContent).toBe("nord");
    expect(document.documentElement.getAttribute("data-theme")).toBe("nord");
    expect(localStorage.getItem("autodev_theme")).toBe("nord");

    const selectForestBtn = screen.getByText("Select Evergreen Forest");
    fireEvent.click(selectForestBtn);

    expect(screen.getByTestId("current-theme").textContent).toBe("forest");
    expect(document.documentElement.getAttribute("data-theme")).toBe("forest");
    expect(localStorage.getItem("autodev_theme")).toBe("forest");
  });
});

