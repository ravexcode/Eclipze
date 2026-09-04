"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";

import { useRouter } from "next/navigation";

export default function IssuesPage() {
  const router = useRouter();

  return (
    <DashLayout current="issues" router={router}>
      <main className="w-full">
        <Heading label="Issues" />
      </main>
    </DashLayout>
  );
}
