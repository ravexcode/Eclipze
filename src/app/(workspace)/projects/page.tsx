"use client";

import { useRouter } from "next/navigation";

import DashLayout from "@/components/layouts/dash";
import ProjectsWorkspace from "@/components/projects/workspace";

export default function ProjectsPage() {
  const router = useRouter();

  return (
    <DashLayout current="projects" router={router}>
      <ProjectsWorkspace />
    </DashLayout>
  );
}
