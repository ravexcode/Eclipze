"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";

import { useRouter } from "next/navigation";

export default function OverviewPage() {
  const router = useRouter();

  return (
    <DashLayout current="overview" router={router}>
      <main className="w-full">
        <Heading label="Overview" />
      </main>
    </DashLayout>
  );
}
