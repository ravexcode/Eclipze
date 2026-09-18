"use client";

import DashLayout from "@/components/layouts/dash"

import { useRouter } from "next/navigation";

export default function AgentsPage() {
  const router = useRouter();

  return (
    <DashLayout
      current="agents"
      router={router}>

    </DashLayout>
  )
}
