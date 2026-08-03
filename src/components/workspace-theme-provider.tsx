"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const workspaceThemes = [
  { id: "bunny-life", name: "粉雪日常", note: "奶油色与粉雪兔兔", colors: ["#fffaf5", "#f7d9e2", "#89c9dd"] },
  { id: "cat-cafe", name: "奶茶手帐", note: "温暖纸张与咖啡色", colors: ["#f7ead6", "#c9996b", "#695046"] },
  { id: "peach-bubble", name: "蜜桃泡泡", note: "柔粉果冻与活泼互动", colors: ["#fff0f5", "#ff9fbd", "#a789ef"] },
  { id: "forest-diary", name: "森林日记", note: "柔和绿意与自然质感", colors: ["#f2f1df", "#87a878", "#8a684b"] },
  { id: "little-planet", name: "月光星球", note: "天空蓝与漂浮星光", colors: ["#edf8ff", "#bde7ff", "#7289ff"] },
  { id: "pet-assistant", name: "双星伙伴", note: "角色陪伴与任务互动", colors: ["#f2fff4", "#bceccb", "#62b885"] },
] as const;

export type WorkspaceTheme = (typeof workspaceThemes)[number]["id"];
const STORAGE_KEY = "workspace-interface-theme";
const ids = new Set<string>(workspaceThemes.map(theme=>theme.id));
type ThemeContextValue = { workspaceTheme:WorkspaceTheme; setWorkspaceTheme:(theme:WorkspaceTheme)=>void };
const WorkspaceThemeContext=createContext<ThemeContextValue|null>(null);

export function WorkspaceThemeProvider({children}:{children:React.ReactNode}){
  const [workspaceTheme,setWorkspaceThemeState]=useState<WorkspaceTheme>(()=>{
    if(typeof window==="undefined")return "bunny-life";
    const saved=localStorage.getItem(STORAGE_KEY);
    return saved&&ids.has(saved)?saved as WorkspaceTheme:"bunny-life";
  });
  useEffect(()=>{document.documentElement.dataset.workspaceTheme=workspaceTheme;localStorage.setItem(STORAGE_KEY,workspaceTheme)},[workspaceTheme]);
  const value=useMemo(()=>({workspaceTheme,setWorkspaceTheme:setWorkspaceThemeState}),[workspaceTheme]);
  return <WorkspaceThemeContext.Provider value={value}>{children}</WorkspaceThemeContext.Provider>;
}
export function useWorkspaceTheme(){const value=useContext(WorkspaceThemeContext);if(!value)throw new Error("useWorkspaceTheme must be used inside WorkspaceThemeProvider");return value}
