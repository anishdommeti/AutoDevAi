/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: "var(--bg-primary)",
          "bg-secondary": "var(--bg-secondary)",
          "bg-tertiary": "var(--bg-tertiary)",
          "bg-elevated": "var(--bg-elevated)",
          "bg-sidebar": "var(--sidebar-bg)",
          "bg-card": "var(--card-bg)",
          "bg-input": "var(--input-bg)",
          
          text: "var(--text-primary)",
          "text-secondary": "var(--text-secondary)",
          "text-muted": "var(--text-muted)",
          "text-inverse": "var(--text-inverse)",
          
          border: "var(--border-default)",
          "border-subtle": "var(--border-subtle)",
          "border-strong": "var(--border-strong)",
          
          accent: "var(--accent-primary)",
          "accent-hover": "var(--accent-hover)",
          "accent-subtle": "var(--accent-subtle)",
          "accent-text": "var(--accent-text)",
          
          success: "var(--status-success)",
          warning: "var(--status-warning)",
          error: "var(--status-error)",
          info: "var(--status-info)",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "18px",
      }
    },
  },
  plugins: [],
}
