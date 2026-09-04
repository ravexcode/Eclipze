"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";

import { useRouter } from "next/navigation";

export default function AgentsPage() {
  const router = useRouter();

  return (
    <DashLayout current="agents" router={router}>
      <main className="w-full">
        <Heading label="Agent" />
      </main>
    </DashLayout>
  );
}
