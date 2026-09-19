"use client";

import DashLayout from "@/components/layouts/dash";

import { useRouter } from "next/navigation";

export default function AgentsPage() {
  const router = useRouter();

  return (
    <DashLayout
    current="agents"
    router={router}>

      <main
      className="w-full h-dvh flex flex-col items-center justify-center">

        <section
        className="w-full flex items-center justify-center p-10">

          <p className="text-3xl font-medium text-center w-full">

          </p>

        </section>
      </main>
    </DashLayout>
  );
}
