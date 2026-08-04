"use client";
import { createContext, useContext } from "react";
export const workspaceThemes=[{id:"glass-pink",name:"粉白玻璃",note:"Apple 风格的柔粉透明玻璃",colors:["#fff8fb","#f8b7d0","#ed5f98"]}] as const;
export type WorkspaceTheme="glass-pink";
type ThemeContextValue={workspaceTheme:WorkspaceTheme;setWorkspaceTheme:(theme:WorkspaceTheme)=>void};
const WorkspaceThemeContext=createContext<ThemeContextValue|null>(null);
export function WorkspaceThemeProvider({children}:{children:React.ReactNode}){return <WorkspaceThemeContext.Provider value={{workspaceTheme:"glass-pink",setWorkspaceTheme:()=>{}}}>{children}</WorkspaceThemeContext.Provider>}
export function useWorkspaceTheme(){const value=useContext(WorkspaceThemeContext);if(!value)throw new Error("useWorkspaceTheme must be used inside WorkspaceThemeProvider");return value}
