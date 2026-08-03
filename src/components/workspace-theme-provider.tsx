"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const workspaceThemes = [
  { id: "bunny-life", name: "樱花侧栏", note: "粉色窄栏与柔白卡片", colors: ["#fff3f7", "#ff96b7", "#ffd5e2"] },
  { id: "cat-cafe", name: "晴空清单", note: "蓝色导轨与清爽列表", colors: ["#eef8ff", "#72bdf3", "#cdeaff"] },
  { id: "peach-bubble", name: "莓果糖盒", note: "粉紫糖果与圆润模块", colors: ["#fff0f7", "#f487b0", "#c99af5"] },
  { id: "forest-diary", name: "薄荷分栏", note: "蓝绿色双层功能导航", colors: ["#eefbfa", "#70c8c2", "#bdece8"] },
  { id: "little-planet", name: "云朵胶囊", note: "天蓝胶囊与轻盈画布", colors: ["#f2f8ff", "#7daef7", "#d7e7ff"] },
  { id: "pet-assistant", name: "蜜桃花瓣", note: "浅粉留白与花瓣层级", colors: ["#fff6f7", "#f2a0ae", "#f8d3d9"] },
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
