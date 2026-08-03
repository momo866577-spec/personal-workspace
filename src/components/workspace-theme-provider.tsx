"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const workspaceThemes = [
  { id: "minimal-light", name: "Minimal Light", note: "明亮、留白、清晰", colors: ["#f7f7f8", "#ffffff", "#5b55d6"] },
  { id: "midnight-pro", name: "Midnight Pro", note: "專業、高對比、精準", colors: ["#0b0c10", "#17191f", "#8b7cff"] },
  { id: "glass-flow", name: "Glass Flow", note: "透明、漸層、流動", colors: ["#dcd8ff", "#eef7ff", "#7866ed"] },
  { id: "warm-journal", name: "Warm Journal", note: "溫暖、寬鬆、紙感", colors: ["#f5efe5", "#fffaf2", "#9a6848"] },
  { id: "focus-compact", name: "Focus Compact", note: "緊湊、高效、快速", colors: ["#eef0f3", "#ffffff", "#236bd8"] },
] as const;

export type WorkspaceTheme = (typeof workspaceThemes)[number]["id"];
const STORAGE_KEY = "workspace-interface-theme";
const ids = new Set<string>(workspaceThemes.map((theme) => theme.id));

type ThemeContextValue = { workspaceTheme: WorkspaceTheme; setWorkspaceTheme: (theme: WorkspaceTheme) => void };
const WorkspaceThemeContext = createContext<ThemeContextValue | null>(null);

export function WorkspaceThemeProvider({ children }: { children: React.ReactNode }) {
  const [workspaceTheme, setWorkspaceThemeState] = useState<WorkspaceTheme>(() => {
    if (typeof window === "undefined") return "minimal-light";
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && ids.has(saved) ? saved as WorkspaceTheme : "minimal-light";
  });

  useEffect(() => {
    document.documentElement.dataset.workspaceTheme = workspaceTheme;
    localStorage.setItem(STORAGE_KEY, workspaceTheme);
  }, [workspaceTheme]);

  const value = useMemo(() => ({ workspaceTheme, setWorkspaceTheme: setWorkspaceThemeState }), [workspaceTheme]);
  return <WorkspaceThemeContext.Provider value={value}>{children}</WorkspaceThemeContext.Provider>;
}

export function useWorkspaceTheme() {
  const value = useContext(WorkspaceThemeContext);
  if (!value) throw new Error("useWorkspaceTheme must be used inside WorkspaceThemeProvider");
  return value;
}
