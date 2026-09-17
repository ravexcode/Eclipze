"use client";

import { useEffect, useState } from "react";
import { IconArrowUpRight, IconPointer } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";
import Button from "@/components/ui/button";
import { apiFetch } from "@/utils/api-fetch";
import type { GmailMessageSummary } from "@/types/mail";
import type { AiProvider } from "@/types/ai";

function priorityClass(value: string) {
  return value === "HIGH"
    ? "text-priority-high"
    : value === "MEDIUM"
      ? "text-priority-medium"
      : "text-priority-low";
}

export default function MailsPage() {
  const router = useRouter();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const c = await apiFetch("/api/gmail/connection");
        const data = await c.json();

        setConnected(data.connected);

        if (!data.connected) return;

        const m = await apiFetch("/api/gmail/messages");
        const md = await m.json();

        setMessages(md.messages ?? []);

        const p = await apiFetch("/api/ai-providers");
        const pd = await p.json();

        setProviders(
          (pd.connections ?? []).map(
            (connection: { provider: AiProvider }) => connection.provider,
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load mails.");
      }
    })();
  }, []);

  async function connectGmail() {
    const response = await apiFetch("/api/gmail/connect", {
      headers: { "x-gmail-connect": "1" },
    });
    const data = await response.json();
    const redirect = data.redirect as string | undefined;

    if (redirect) window.location.assign(redirect);
    else setError("Unable to start Google sign-in.");
  }

  async function review(message: GmailMessageSummary) {
    const provider = providers[0];
    if (!provider) {
      setError("Connect an AI provider with a model in Settings first.");
      return;
    }
    if (
      !window.confirm(`Send this email to ${provider} for importance review?`)
    )
      return;
    setReviewing(message.id);
    try {
      const response = await apiFetch(
        `/api/gmail/messages/${message.id}/importance`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ provider }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessages((items) =>
        items.map((item) =>
          item.id === message.id
            ? { ...item, importance: data.importance }
            : item,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed.");
    } finally {
      setReviewing(null);
    }
  }

  return (
    <DashLayout current="mails" router={router}>
      <main className="w-full">
        <Heading label="Mails" />
        <div className="mx-auto w-full max-w-207.25 px-6 py-12">
          {connected === false && (
            <div className="flex min-h-[55vh] items-center justify-center">
              <Button variant="secondary" onClick={connectGmail}>
                Sign in with Google for access to your emails
              </Button>
            </div>
          )}
          {connected === true && messages.length === 0 && (
            <div className="flex min-h-[55vh] items-center justify-center text-3xl text-foreground-off">
              No mails found
            </div>
          )}
          {error && <p className="mb-4 text-sm text-priority-high">{error}</p>}
          {messages.map((message) => (
            <div
              key={message.id}
              className="mb-2 flex h-13.5 items-center rounded-sm bg-background-card px-4"
            >
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => router.push(`/mails/${message.id}`)}
              >
                <div className="truncate text-[13px] text-foreground">
                  {message.subject}
                </div>
                <div className="truncate font-mono text-[8px] text-foreground-off">
                  {message.sender}
                </div>
              </button>
              <div className="w-28 text-right text-[10px]">
                {message.importance ? (
                  <span className={priorityClass(message.importance)}>
                    {message.importance}
                  </span>
                ) : (
                  <button
                    className="inline-flex items-center gap-1 text-foreground-off hover:text-foreground"
                    disabled={reviewing === message.id}
                    onClick={() => review(message)}
                  >
                    <IconPointer size={13} /> Review importance with Agents
                  </button>
                )}
              </div>
              <IconArrowUpRight
                size={16}
                className="ml-4 text-foreground-off"
              />
            </div>
          ))}
        </div>
      </main>
    </DashLayout>
  );
}
