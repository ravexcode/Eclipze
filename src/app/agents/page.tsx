"use client";

import DashLayout from "@/components/layouts/dash";

import AgentsInput from "@/components/agents/input";
import Heading from "@/components/ui/heading";
import SelectorInput from "@/components/ui/selector";

import { useRouter } from "next/navigation";

import { useState } from "react";

export default function AgentsPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState<string>("");

  const defaultModels: string[] = [
    "GPT 6 Astra",
    "GPT 6 Sol",
    "GPT 6 Luna",
    "GPT 5.6 Sol",
    "GPT 5.6 Terra",
    "GPT 5.6 Luna",
    "GPT 5.5 Pro",
  ];
  const [model, setModel] = useState<string>(
    defaultModels[0]
  );

  return (
    <DashLayout
      current="agents"
      router={router}>
      <main className="flex min-h-dvh min-w-0 flex-col">
        <Heading label="Agents" />

        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
          <section className="mx-auto w-full max-w-3xl rounded-sm bg-background-card py-3 px-4">
            <AgentsInput
              value={prompt}
              setValue={setPrompt} />

            <div className="mt-5 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <SelectorInput
                current={model}
                setCurrent={setModel}
                values={defaultModels}
                width="min-w-48" />
            </div>
          </section>
        </div>
      </main>
    </DashLayout>
  );
}
