import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeType = 
  | "light"
  | "dark"
  | "midnight"
  | "oled-black"
  | "nord"
  | "forest"
  | "warm-sand";

export interface ThemeInfo {
  id: ThemeType;
  name: string;
  description: string;
  category: "Light" | "Dark" | "Special";
  previewColors: {
    bg: string;
    card: string;
    accent: string;
    border: string;
    text: string;
  };
}

export const THEMES: ThemeInfo[] = [
  {
    id: "light",
    name: "Clean Light",
    description: "Crisp slate and clean surfaces with high readability",
    category: "Light",
    previewColors: {
      bg: "#f8fafc",
      card: "#ffffff",
      accent: "#4f46e5",
      border: "#e2e8f0",
      text: "#0f172a",
    },
  },
  {
    id: "dark",
    name: "Modern Dark",
    description: "Deep slate dark mode with indigo highlights",
    category: "Dark",
    previewColors: {
      bg: "#0b0f19",
      card: "#111827",
      accent: "#6366f1",
      border: "#1f293d",
      text: "#f8fafc",
    },
  },
  {
    id: "midnight",
    name: "Deep Midnight",
    description: "Oceanic navy blue with vivid cyan accents",
    category: "Dark",
    previewColors: {
      bg: "#050b14",
      card: "#091322",
      accent: "#0ea5e9",
      border: "#1b304f",
      text: "#f0f6fc",
    },
  },
  {
    id: "oled-black",
    name: "OLED Black",
    description: "True pure #000000 black with emerald accents for maximum contrast",
    category: "Dark",
    previewColors: {
      bg: "#000000",
      card: "#0a0a0a",
      accent: "#10b981",
      border: "#2a2a2a",
      text: "#ffffff",
    },
  },
  {
    id: "nord",
    name: "Nord Arctic",
    description: "Polar night slate with frosted turquoise highlights",
    category: "Special",
    previewColors: {
      bg: "#2e3440",
      card: "#3b4252",
      accent: "#88c0d0",
      border: "#4c566a",
      text: "#eceff4",
    },
  },
  {
    id: "forest",
    name: "Evergreen Forest",
    description: "Deep pine greens and soothing moss earth tones",
    category: "Special",
    previewColors: {
      bg: "#07150e",
      card: "#0d2218",
      accent: "#22c55e",
      border: "#1c4530",
      text: "#f0fdf4",
    },
  },
  {
    id: "warm-sand",
    name: "Warm Sand",
    description: "Comfortable desert stone with warm amber & terracotta tones",
    category: "Light",
    previewColors: {
      bg: "#faf6f0",
      card: "#ffffff",
      accent: "#d97706",
      border: "#e0d5c3",
      text: "#292524",
    },
  },
];

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  density: "comfortable" | "compact";
  setDensity: (density: "comfortable" | "compact") => void;
  reducedMotion: boolean;
  setReducedMotion: (reduce: boolean) => void;
  editorFontSize: number;
  setEditorFontSize: (size: number) => void;
  editorWordWrap: "on" | "off";
  setEditorWordWrap: (wrap: "on" | "off") => void;
  editorTheme: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem("autodev_theme");
    return (saved as ThemeType) || "dark";
  });

  const [density, setDensityState] = useState<"comfortable" | "compact">(() => {
    return (localStorage.getItem("autodev_density") as "comfortable" | "compact") || "comfortable";
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    return localStorage.getItem("autodev_reduced_motion") === "true";
  });

  const [editorFontSize, setEditorFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem("autodev_editor_font_size");
    return saved ? parseInt(saved, 10) : 14;
  });

  const [editorWordWrap, setEditorWordWrapState] = useState<"on" | "off">(() => {
    return (localStorage.getItem("autodev_editor_word_wrap") as "on" | "off") || "on";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("autodev_theme", theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => setThemeState(newTheme);

  const setDensity = (newDensity: "comfortable" | "compact") => {
    setDensityState(newDensity);
    localStorage.setItem("autodev_density", newDensity);
  };

  const setReducedMotion = (val: boolean) => {
    setReducedMotionState(val);
    localStorage.setItem("autodev_reduced_motion", String(val));
  };

  const setEditorFontSize = (size: number) => {
    setEditorFontSizeState(size);
    localStorage.setItem("autodev_editor_font_size", String(size));
  };

  const setEditorWordWrap = (wrap: "on" | "off") => {
    setEditorWordWrapState(wrap);
    localStorage.setItem("autodev_editor_word_wrap", wrap);
  };

  // Determine monaco editor theme (vs-dark vs light)
  const editorTheme = theme === "light" || theme === "warm-sand" ? "light" : "vs-dark";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        density,
        setDensity,
        reducedMotion,
        setReducedMotion,
        editorFontSize,
        setEditorFontSize,
        editorWordWrap,
        setEditorWordWrap,
        editorTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

