"use client";

import DashLayout from "@/components/layouts/dash";

import AgentsInput from "@/components/agents/input";
import Heading from "@/components/ui/heading";
import SelectorInput from "@/components/ui/selector";

import { IconSparkles } from "@tabler/icons-react";

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

  return (
    <DashLayout
      current="agents"
      router={router}>
      <main className="flex min-h-dvh min-w-0 flex-col">
        <Heading label="Agents" />

        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
          <section className="mx-auto w-full max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-background-focus text-accent-strong">
                <IconSparkles
                  aria-hidden="true"
                  size={20}
                  stroke={1.8} />
              </div>

              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground-off">
                Agent workspace
              </p>
            </div>

            <header className="mb-8 max-w-2xl">
              <h1 className="text-3xl font-medium leading-tight tracking-[-0.04em] text-foreground sm:text-4xl">
                What would you like to work on?
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-foreground-off sm:text-base">
                Describe the task and add the context that will help you get started.
              </p>
            </header>

            <section className="rounded-sm bg-background-card p-4 sm:p-6">
              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Your prompt
                </span>

                <div className="mt-4 rounded-sm bg-background p-4 transition-colors focus-within:ring-1 focus-within:ring-accent sm:p-5">
                  <div className="[&_textarea]:min-h-36 [&_textarea]:max-h-80 [&_textarea]:resize-y [&_textarea]:bg-transparent [&_textarea]:px-0 [&_textarea]:text-sm [&_textarea]:leading-6 [&_textarea]:text-foreground [&_textarea]:placeholder:text-foreground-off [&_textarea]:focus:outline-hidden">
                    <AgentsInput
                      value={prompt}
                      setValue={setPrompt} />
                  </div>
                </div>
              </label>

              <div className="mt-5 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-foreground-off">
                    Model
                  </span>

                  <SelectorInput
                    current={model}
                    setCurrent={setModel}
                    values={defaultModels}
                    width="min-w-48" />
                </div>

                <p className="text-xs leading-5 text-foreground-off">
                  Choose the model that fits your task.
                </p>
              </div>
            </section>
          </section>
        </div>
      </main>
    </DashLayout>
  );
}
