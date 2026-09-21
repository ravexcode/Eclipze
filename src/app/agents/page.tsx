"use client";

import DashLayout from "@/components/layouts/dash";

import AgentsInput from "@/components/agents/input";
import SelectorInput from "@/components/ui/selector";

import { useRouter } from "next/navigation";

import { useState } from "react";

export default function AgentsPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState<string>("");

  const defaultModels: string[] = [
    "gpt-5",
    "gpt-5-chat-latest",
    "gpt-5-mini",
    "gpt-5-nano",
    "gpt-5-thinking",
    "gpt-5-thinking-mini",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "o4-mini"
  ];
  const [model, setModel] = useState<string>(
    defaultModels[0]
  );

  const onSend = () => {
    return console.log("Prompt sent!");
  };

  return (
    <DashLayout
      current="agents"
      router={router}>

      <main
        className="w-full h-dvh flex flex-col items-center justify-center p-10">

        <section
          className="w-full max-w-160 bg-background-card py-5 px-4 flex flex-col items-center justify-center gap-3">
          <AgentsInput
            value={prompt}
            setValue={setPrompt} />

          <div
            className="w-full flex items-center justify-between text-sm">

            <SelectorInput
              current={model}
              setCurrent={setModel}
              values={defaultModels}
              width="w-20" />

          </div>
        </section>
      </main>

    </DashLayout>
  )
}
