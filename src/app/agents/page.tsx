"use client";

import DashLayout from "@/components/layouts/dash";

import AgentsInput from "@/components/agents/input";
import Heading from "@/components/ui/heading";
import SelectorInput from "@/components/ui/selector";
import type { AiProviderConnection } from "@/types/ai";
import type { SessionUser } from "@/types/user";
import { apiFetch } from "@/utils/api-fetch";
import { getSessionUser } from "@/utils/session";
import { getAvailableModels } from "@/utils/agents";

import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

export default function AgentsPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState<string>("");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUserModels() {
      try {
        const [currentUser, response] = await Promise.all([
          getSessionUser(),
          apiFetch("/api/ai-providers", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (cancelled) return;

        if (!currentUser) {
          router.replace("/auth/signin");
          return;
        }

        const data = await response.json() as {
          message?: string;
          connections?: AiProviderConnection[];
        };

        if (!response.ok) {
          setError(data.message ?? "Unable to load your available models.");
          return;
        }

        const availableModels = getAvailableModels(data.connections ?? []);
        setUser(currentUser);
        setModels(availableModels);
        setModel(availableModels[0] ?? "");
      } catch {
        if (!cancelled) {
          setError("Unable to load your available models.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadUserModels();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
              {isLoading ? (
                <p className="text-sm text-foreground-off" role="status">
                  Loading your models...
                </p>
              ) : error ? (
                <p className="text-sm text-priority-high" role="alert">
                  {error}
                </p>
              ) : models.length > 0 ? (
                <SelectorInput
                  current={model}
                  setCurrent={setModel}
                  values={models}
                  width="min-w-48" />
              ) : (
                <p className="text-xs text-orange-500/80">
                  No models configured. Connect a provider and choose a model in Settings.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </DashLayout>
  );
}
