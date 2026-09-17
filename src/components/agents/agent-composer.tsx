"use client";

import type { AiProviderConnection } from "@/types/ai";
import { IconAlertTriangle, IconSend } from "@tabler/icons-react";
import KeyHints from "./key-hints";
import ModelSelector from "./model-selector";
import type { ModelOption } from "./types";

export default function AgentComposer({
  prompt,
  model,
  models,
  connections,
  hasAgents,
  isLoading,
  isSending,
  error,
  onPromptChange,
  onModelChange,
  onSubmit,
  onManageAgents,
}: {
  prompt: string;
  model: string;
  models: ModelOption[];
  connections: AiProviderConnection[];
  hasAgents: boolean;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  onPromptChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onManageAgents: () => void;
}) {
  const hasKeys = connections.length > 0;
  const canSend = prompt.trim().length > 0 && hasAgents && hasKeys && !isLoading && !isSending;

  return (
    <div className="w-full max-w-240">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl">
          What should your agent work on?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-foreground-off">
          Describe a task, ask a question, or give your agent the next step.
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-sm bg-background-card p-3">
        <textarea
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          className="min-h-44 w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-hidden placeholder:text-foreground-off/70"
          placeholder="Ask your agent to investigate, plan, or build…"
          aria-label="Message your agent"
        />

        <div className="mt-4 flex flex-col gap-3">
          <ModelSelector
            model={model}
            models={models}
            connections={connections}
            onChange={onModelChange}
          />

          {!isLoading && !hasKeys && (
            <div className="flex flex-col items-center justify-center gap-1 py-2 text-center text-warning">
              <IconAlertTriangle size={17} strokeWidth={1.8} />
              <p className="text-sm font-medium">Agents not configured yet</p>
              <p className="text-xs text-warning/80">
                Connect an API key before starting an agent session.
              </p>
            </div>
          )}

          {!isLoading && !hasAgents && hasKeys && (
            <div className="flex flex-col items-center justify-center gap-1 py-2 text-center text-warning">
              <IconAlertTriangle size={17} strokeWidth={1.8} />
              <p className="text-sm font-medium">Agents not configured yet</p>
              <button
                type="button"
                onClick={onManageAgents}
                className="text-xs underline underline-offset-2 hover:text-foreground">
                Manage agents
              </button>
            </div>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-priority-high bg-background-card p-3 text-sm text-priority-high">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="hidden text-xs text-foreground-off/60 sm:inline">
            ⌘ Enter to send
          </span>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <KeyHints connections={connections} compact />
            <button
              type="submit"
              disabled={!canSend}
              className="flex shrink-0 items-center gap-2 rounded-sm bg-accent px-3 py-2 text-sm text-foreground transition-opacity hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
              title={
                !hasKeys
                  ? "Connect an API key before sending"
                  : !hasAgents
                    ? "Create an agent before sending"
                    : undefined
              }>
              <span>{isSending ? "Starting…" : "Send"}</span>
              <IconSend size={16} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
