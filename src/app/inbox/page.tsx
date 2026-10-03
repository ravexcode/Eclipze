"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { IconEdit, IconInbox, IconRefresh, IconSend } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

import MailComposeForm from "@/components/inbox/mail-compose-form";
import MailDetail from "@/components/inbox/mail-detail";
import MailList from "@/components/inbox/mail-list";
import DashLayout from "@/components/layouts/dash";
import type { MailFolder, MailFormValues, MailItem } from "@/types/mail";
import { apiFetch } from "@/utils/api-fetch";

const EMPTY_FORM: MailFormValues = { to: "", subject: "", body: "" };

export default function InboxPage() {
  const router = useRouter();
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [mails, setMails] = useState<MailItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState<MailFormValues>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMails = useCallback(async (nextFolder: MailFolder = folder) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/mails?folder=${nextFolder}`, { cache: "no-store" });
      const payload = await response.json() as { mails?: MailItem[]; message?: string };

      if (!response.ok) throw new Error(payload.message ?? "Unable to load your mail.");

      const nextMails = payload.mails ?? [];
      setMails(nextMails);
      setSelectedId(current => nextMails.some(mail => mail.id === current) ? current : nextMails[0]?.id ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your mail.");
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => {
    void loadMails(folder);
  }, [folder, loadMails]);

  const selectedMail = mails.find(mail => mail.id === selectedId) ?? null;

  const filteredMails = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return mails;

    return mails.filter(mail => {
      const person = folder === "inbox" ? mail.sender : mail.recipient;
      return `${mail.subject} ${mail.body} ${person.username ?? ""} ${person.email}`
        .toLocaleLowerCase()
        .includes(search);
    });
  }, [folder, mails, query]);

  const selectFolder = (nextFolder: MailFolder) => {
    setFolder(nextFolder);
    setSelectedId("");
    setComposeOpen(false);
  };

  const selectMail = async (mail: MailItem) => {
    setSelectedId(mail.id);
    setComposeOpen(false);
    if (folder !== "inbox" || mail.readAt) return;

    const readAt = new Date().toISOString();
    setMails(current => current.map(item => item.id === mail.id ? { ...item, readAt } : item));

    try {
      const response = await apiFetch(`/api/mails/${mail.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (!response.ok) throw new Error("Unable to mark this message as read.");
    } catch (readError) {
      setMails(current => current.map(item => item.id === mail.id ? { ...item, readAt: null } : item));
      setError(readError instanceof Error ? readError.message : "Unable to mark this message as read.");
    }
  };

  const startCompose = (replyTo?: MailItem) => {
    if (!replyTo) {
      setForm(EMPTY_FORM);
    } else {
      const subject = /^re:\s/i.test(replyTo.subject) ? replyTo.subject : `Re: ${replyTo.subject}`;
      setForm({ to: replyTo.sender.email, subject: subject.slice(0, 200), body: "" });
    }

    setError(null);
    setComposeOpen(true);
  };

  const sendMail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);

    try {
      const response = await apiFetch("/api/mails", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => null) as { mail?: MailItem; message?: string } | null;

      if (!response.ok || !payload?.mail) {
        throw new Error(payload?.message ?? "Unable to send your message.");
      }

      const sentMail = payload.mail;
      setFolder("sent");
      setMails(current => [sentMail, ...current.filter(mail => mail.id !== sentMail.id)]);
      setSelectedId(sentMail.id);
      setForm(EMPTY_FORM);
      setComposeOpen(false);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send your message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashLayout current="inbox" router={router}>
      <main className="flex min-h-dvh min-w-0 flex-col lg:h-dvh lg:flex-row lg:overflow-hidden">
        <aside className="flex min-h-0 w-full flex-col border-b border-background-focus bg-background-card lg:w-[375px] lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 border-b border-background-focus p-4">
            <h1 className="text-[18px] font-medium">Mail</h1>
            <button
              type="button"
              onClick={() => startCompose()}
              className="inline-flex h-9 items-center gap-2 rounded-xs bg-accent px-3 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong"
            >
              <IconEdit size={16} /> Compose
            </button>
          </div>

          <div className="grid grid-cols-2 border-b border-background-focus p-2">
            {(["inbox", "sent"] as const).map(item => (
              <button
                key={item}
                type="button"
                onClick={() => selectFolder(item)}
                aria-pressed={folder === item}
                className={`rounded-xs px-3 py-2 text-[13px] capitalize transition-colors ${folder === item ? "bg-background-focus text-foreground" : "text-foreground-off hover:text-foreground"}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="border-b border-background-focus p-3">
            <label className="sr-only" htmlFor="mail-search">Search mail</label>
            <input
              id="mail-search"
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search mail"
              className="h-10 w-full rounded-full bg-background-focus px-4 text-[14px] text-foreground outline-hidden placeholder:text-foreground-off focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>

          {loading ? (
            <p role="status" className="p-5 text-[14px] text-foreground-off">Loading {folder}…</p>
          ) : filteredMails.length ? (
            <MailList folder={folder} mails={filteredMails} selectedId={selectedId} onSelect={mail => void selectMail(mail)} />
          ) : (
            <p className="p-5 text-[14px] text-foreground-off">{query ? "No matching messages." : "No messages in this folder."}</p>
          )}
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex h-[50px] shrink-0 items-center justify-between border-b border-background-focus px-5 sm:px-7">
            <div className="flex items-center gap-2 text-[14px] text-foreground-off">
              <IconInbox size={18} />
              <span className="capitalize">{folder}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadMails()}
              aria-label="Refresh mail"
              className="rounded-xs p-2 text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground"
            >
              <IconRefresh size={18} />
            </button>
          </header>

          {error && !composeOpen ? <p role="alert" className="border-b border-alert-red/30 px-6 py-2.5 text-[14px] text-alert-red">{error}</p> : null}

          {composeOpen ? (
            <MailComposeForm
              values={form}
              busy={sending}
              error={error}
              onChange={updates => setForm(current => ({ ...current, ...updates }))}
              onSubmit={sendMail}
              onCancel={() => { setComposeOpen(false); setError(null); }}
            />
          ) : loading ? (
            <p role="status" className="p-7 text-[15px] text-foreground-off">Loading message…</p>
          ) : selectedMail ? (
            <MailDetail mail={selectedMail} folder={folder} onReply={() => startCompose(selectedMail)} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-foreground-off">
              <IconInbox size={22} strokeWidth={1.6} />
              <p className="text-[16px]">Select a message to read it.</p>
              <p className="text-[14px]">{folder === "inbox" ? "Messages sent to you will appear here." : "Messages you send will appear here."}</p>
              {error ? <p role="alert" className="mt-2 text-[14px] text-alert-red">{error}</p> : null}
            </div>
          )}
        </section>
      </main>
    </DashLayout>
  );
}
