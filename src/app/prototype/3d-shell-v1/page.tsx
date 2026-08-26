import type { Metadata } from "next";
import { ExperienceShell } from "./_components/experience-shell";

export const metadata: Metadata = {
  title: "Personal Space · 3D UX Shell V1",
  description: "Personal Workspace guided 3D navigation prototype",
};

export default function PersonalWorkspace3DShellPage() {
  return <ExperienceShell />;
}
