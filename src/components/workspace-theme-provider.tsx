"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const workspaceThemes = [
  { id: "mochi-cute", name: "Mochi Cute", note: "奶油麻糬般柔軟乾淨", colors: ["#fffaf1", "#ffffff", "#a78bfa"] },
  { id: "peach-milk", name: "Peach Milk", note: "蜜桃、奶茶與柔軟泡泡", colors: ["#fff1ec", "#ffd8cc", "#f59b8c"] },
  { id: "bubble-pop", name: "Bubble Pop", note: "糖果色與彈跳互動", colors: ["#f4f0ff", "#ff9fcf", "#76d7ff"] },
  { id: "bunny-journal", name: "Bunny Journal", note: "紙張、貼紙與兔兔手帳", colors: ["#fff9ee", "#f2dfc4", "#d98f9f"] },
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
    if (typeof window === "undefined") return "mochi-cute";
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && ids.has(saved) ? saved as WorkspaceTheme : "mochi-cute";
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
