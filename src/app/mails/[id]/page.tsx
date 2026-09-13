"use client";
import { SubmitEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";
import Button from "@/components/ui/button";
import { apiFetch } from "@/utils/api-fetch";
import type { GmailMessageDetail } from "@/types/mail";
export default function MailDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState<GmailMessageDetail | null>(null);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => {
    apiFetch(`/api/gmail/messages/${id}`)
      .then((r) => r.json())
      .then(setMessage)
      .catch((e) => setStatus(e.message));
  }, [id]);
  async function submit(e: SubmitEvent) {
    e.preventDefault();
    setStatus("Sending…");
    const r = await apiFetch(`/api/gmail/messages/${id}/reply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const d = await r.json();
    if (d.requiresGmailSend) {
      const auth = await apiFetch(
        `/api/gmail/connect?mode=send&returnTo=/mails/${id}`,
        { headers: { "x-gmail-connect": "1" } },
      );
      const data = await auth.json();
      const redirect = data.redirect as string | undefined;
      if (redirect) window.location.assign(redirect);
      return;
    }
    setStatus(r.ok ? "Reply sent." : d.message);
    if (r.ok) setBody("");
  }
  return (
    <DashLayout current="mails" router={router}>
      <main className="w-full">
        <Heading label="Mails" />
        <div className="mx-auto max-w-3xl px-6 py-10">
          <button
            className="mb-8 text-sm text-foreground-off"
            onClick={() => router.back()}
          >
            ← Back to mails
          </button>
          {message && (
            <>
              <h1 className="text-2xl">{message.subject}</h1>
              <p className="mt-2 font-mono text-xs text-foreground-off">
                {message.sender} ·{" "}
                {new Date(message.receivedAt).toLocaleString()}
              </p>
              <pre className="mt-8 whitespace-pre-wrap rounded-sm bg-background-card p-6 font-sans text-sm leading-6">
                {message.body}
              </pre>
              <form onSubmit={submit} className="mt-8">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-32 w-full rounded-sm border border-background-focus bg-background-card p-4 text-sm outline-none"
                  placeholder="Write a reply…"
                />
                <div className="mt-3 flex items-center gap-4">
                  <Button type="submit" disabled={!body.trim()}>
                    Send reply
                  </Button>
                  <span className="text-xs text-foreground-off">{status}</span>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </DashLayout>
  );
}
