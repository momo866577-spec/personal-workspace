"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const workspaceThemes = [
  { id: "jelly-blue", name: "蓝莓果冻", note: "蓝色左栏果冻工作台", colors: ["#eef6ff", "#2f80ff", "#9bcaff"] },
  { id: "jelly-pink", name: "樱粉果冻", note: "粉色左栏果冻工作台", colors: ["#fff1f7", "#f567a5", "#ffc1dc"] },
  { id: "bunny-life", name: "果冻视界", note: "粉色 VisionOS 三栏果冻工作台", colors: ["#fff2f8", "#ff7fac", "#ffc5dc"] },
  { id: "cat-cafe", name: "晴空留白", note: "蓝色 Apple 双栏轻量空间", colors: ["#f4f9ff", "#76b9f5", "#d7ecff"] },
  { id: "peach-bubble", name: "莓果拼图", note: "粉色 Bento 模块化创意桌面", colors: ["#fff1f7", "#f27fab", "#ffc2db"] },
  { id: "forest-diary", name: "蓝雾漂浮", note: "蓝色玻璃悬浮空间与时间线", colors: ["#effbff", "#62b8df", "#c8efff"] },
  { id: "little-planet", name: "云端手记", note: "蓝色 Notebook 章节式工作台", colors: ["#f3f7ff", "#789ee9", "#dbe5ff"] },
  { id: "pet-assistant", name: "柔粉工作区", note: "粉色 Cursor 风专业效率空间", colors: ["#fff6f9", "#ef91ad", "#f8d3df"] },
] as const;

export type WorkspaceTheme = (typeof workspaceThemes)[number]["id"];
const STORAGE_KEY = "workspace-interface-theme";
const ids = new Set<string>(workspaceThemes.map(theme=>theme.id));
type ThemeContextValue = { workspaceTheme:WorkspaceTheme; setWorkspaceTheme:(theme:WorkspaceTheme)=>void };
const WorkspaceThemeContext=createContext<ThemeContextValue|null>(null);

export function WorkspaceThemeProvider({children}:{children:React.ReactNode}){
  const [workspaceTheme,setWorkspaceThemeState]=useState<WorkspaceTheme>(()=>{
    if(typeof window==="undefined")return "jelly-blue";
    const saved=localStorage.getItem(STORAGE_KEY);
    return saved&&ids.has(saved)?saved as WorkspaceTheme:"jelly-blue";
  });
  useEffect(()=>{document.documentElement.dataset.workspaceTheme=workspaceTheme;localStorage.setItem(STORAGE_KEY,workspaceTheme)},[workspaceTheme]);
  const value=useMemo(()=>({workspaceTheme,setWorkspaceTheme:setWorkspaceThemeState}),[workspaceTheme]);
  return <WorkspaceThemeContext.Provider value={value}>{children}</WorkspaceThemeContext.Provider>;
}

export function useWorkspaceTheme(){const value=useContext(WorkspaceThemeContext);if(!value)throw new Error("useWorkspaceTheme must be used inside WorkspaceThemeProvider");return value}
