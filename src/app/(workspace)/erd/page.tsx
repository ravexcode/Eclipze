"use client";

// Next Setup
import { useRouter } from "next/navigation";

// Components imports
import DashLayout from "@/components/layouts/dash";

export default function ERDPage() {
  const router = useRouter();

  return (
    <DashLayout
      current="erd"
      router={router}

    ></DashLayout>
  )
}
