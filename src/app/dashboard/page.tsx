"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";

import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return <DashLayout
    current="overview"
    router={router}>
      <Heading label="Overview" />
    </DashLayout>;
}
