"use client";
import { Moon, Sun } from "lucide-react";
export function ThemeToggle() {
  return (
    <button
      className="icon-button theme-toggle"
      aria-label="Toggle color theme"
      onClick={() => {
        const theme =
          document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = theme;
        try {
          localStorage.setItem("leadrescue-theme", theme);
        } catch {
          /* Theme still works when browser storage is unavailable. */
        }
      }}
    >
      <Sun className="theme-sun" size={18} />
      <Moon className="theme-moon" size={18} />
    </button>
  );
}
