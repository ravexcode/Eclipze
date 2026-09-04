"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";

import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const router = useRouter();

  return (
    <DashLayout current="projects" router={router}>
      <main className="w-full">
        <Heading label="Projects" />
      </main>
    </DashLayout>
  );
}
