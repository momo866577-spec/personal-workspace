"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { WorkspaceThemeProvider } from "@/components/workspace-theme-provider";
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange><WorkspaceThemeProvider>{children}</WorkspaceThemeProvider></NextThemesProvider>;
}
