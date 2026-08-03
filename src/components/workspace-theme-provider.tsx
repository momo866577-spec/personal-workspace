"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const workspaceThemes = [
  { id: "bunny-life", name: "Bunny Life", note: "兔兔花園養成生活助手", colors: ["#f7f3df", "#cce9b4", "#ef9d71"] },
  { id: "cat-cafe", name: "Cat Cafe", note: "木桌、咖啡與貓掌便條", colors: ["#f7ead6", "#c9996b", "#695046"] },
  { id: "peach-bubble", name: "Peach Bubble", note: "果凍按鈕與漂浮糖果泡泡", colors: ["#fff0f5", "#ff9fbd", "#a789ef"] },
  { id: "forest-diary", name: "Forest Diary", note: "森林小屋與動物日記", colors: ["#f2f1df", "#87a878", "#8a684b"] },
  { id: "little-planet", name: "Little Planet", note: "天空、雲朵與小星球", colors: ["#edf8ff", "#bde7ff", "#7289ff"] },
  { id: "pet-assistant", name: "Pet Assistant", note: "陪你完成每一天的小夥伴", colors: ["#f2fff4", "#bceccb", "#62b885"] },
] as const;

export type WorkspaceTheme = (typeof workspaceThemes)[number]["id"];
const STORAGE_KEY = "workspace-interface-theme";
const ids = new Set<string>(workspaceThemes.map((theme) => theme.id));

type ThemeContextValue = { workspaceTheme: WorkspaceTheme; setWorkspaceTheme: (theme: WorkspaceTheme) => void };
const WorkspaceThemeContext = createContext<ThemeContextValue | null>(null);

export function WorkspaceThemeProvider({ children }: { children: React.ReactNode }) {
  const [workspaceTheme, setWorkspaceThemeState] = useState<WorkspaceTheme>(() => {
    if (typeof window === "undefined") return "bunny-life";
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && ids.has(saved) ? saved as WorkspaceTheme : "bunny-life";
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
