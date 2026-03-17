"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

const themeOrder = ["light", "dark", "system"] as const;
type Theme = (typeof themeOrder)[number];

const themeLabels: Record<Theme, string> = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System preference",
};

const ThemeIcons: Record<Theme, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  function cycleTheme() {
    const currentIndex = themeOrder.indexOf(theme as Theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  }

  const currentTheme = (themeOrder.includes(theme as Theme) ? theme : "system") as Theme;
  const Icon = ThemeIcons[currentTheme];
  const label = themeLabels[currentTheme];

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        "relative p-2 rounded-xl transition-all duration-200",
        "text-surface-500 hover:text-surface-700 hover:bg-surface-100",
        "dark:text-surface-400 dark:hover:text-surface-200 dark:hover:bg-surface-800",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      )}
      aria-label={`Toggle theme. Current: ${label}`}
      title={label}
    >
      <Icon className="w-[18px] h-[18px]" aria-hidden={true} />
    </button>
  );
}
