import type { Metadata } from "next";
import { ExperienceShell } from "./_components/experience-shell";

export const metadata: Metadata = {
  title: "Personal Space · 3D Control Home V2",
  description: "Personal Workspace 3D control home and connected feature spaces",
};

export default function PersonalWorkspace3DShellPage() {
  return <ExperienceShell />;
}
