"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  IconEdit,
  IconInbox,
  IconRefresh
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";

import MailComposeForm from "@/components/inbox/mail-compose-form";
import MailDetail from "@/components/inbox/mail-detail";
import MailList from "@/components/inbox/mail-list";
import DashLayout from "@/components/layouts/dash";
import Dialog from "@/components/ui/dialog";
import Input from "@/components/ui/input";
import type {
  MailFolder,
  MailFormValues,
  MailItem
} from "@/types/mail";
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
    loadMails(folder);
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
  };

  const selectMail = async (mail: MailItem) => {
    setSelectedId(mail.id);
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

  const sendMail = async (event: React.FormEvent<HTMLFormElement>) => {
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

  const closeCompose = () => {
    setComposeOpen(false);
    setError(null);
  };

  return (
    <DashLayout
      current="inbox"
      router={router}>

      <main
        className="flex min-h-full min-w-0 flex-col lg:h-full lg:flex-row lg:overflow-hidden">

        <aside
          className="flex min-h-0 w-full flex-col border-b border-background-focus bg-background-card lg:w-80 lg:shrink-0 lg:border-b-0 lg:border-x">
          <div
            className="flex items-center justify-end gap-3 p-4 text-xs">
            <button
              type="button"
              onClick={() => startCompose()}
              className="bg-accent flex py-1.5 px-3 gap-1 items-center justify-center rounded-md cursor-pointer transition-colors hover:brightness-75 duration-200"
            >
              <IconEdit
                size={16}
                stroke={1.5} />
              Compose
            </button>
          </div>

          <div className="grid grid-cols-2 p-2">
            {(["inbox", "sent"] as const).map(item => (
              <button
                key={item}
                type="button"
                onClick={() => selectFolder(item)}
                aria-pressed={folder === item}
                className={`px-3 py-1.5 text-xs capitalize transition-colors cursor-pointer duration-200 ${folder === item ? "bg-background-focus/30 text-foreground" : "text-foreground-off hover:text-foreground/70"}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="px-3">
            <label className="sr-only" htmlFor="mail-search">Search mail</label>
            <Input
              id="mail-search"
              type="search"
              value={query}
              onChange={setQuery}
              placeholder="Search mail"
            />
          </div>

          {loading ? (
            <p role="status" className="p-5 text-xs text-foreground-off">Loading {folder}…</p>
          ) : filteredMails.length ? (
            <MailList folder={folder} mails={filteredMails} selectedId={selectedId} onSelect={mail => void selectMail(mail)} />
          ) : (
            <p className="p-5 text-xs text-foreground-off">{query ? "No matching messages." : "No messages in this folder."}</p>
          )}
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex h-[50px] shrink-0 items-center justify-between px-5 sm:px-7">
            <div className="flex items-center gap-2 text-xs text-foreground-off">
              <IconInbox size={18} />
              <span className="capitalize">{folder}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadMails()}
              aria-label="Refresh mail"
              className="rounded-md p-2 text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground"
            >
              <IconRefresh size={18} />
            </button>
          </header>

          {error && !composeOpen ? <p role="alert" className="border-b border-alert-red/30 px-6 py-2.5 text-xs text-alert-red">{error}</p> : null}

          {loading ? (
            <p role="status" className="p-7 text-xs text-foreground-off">Loading message…</p>
          ) : selectedMail ? (
            <MailDetail mail={selectedMail} folder={folder} onReply={() => startCompose(selectedMail)} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-foreground-off">
              <IconInbox size={22} strokeWidth={1.6} />
              <p className="text-xs">Select a message to read it.</p>
              <p className="text-xs">{folder === "inbox" ? "Messages sent to you will appear here." : "Messages you send will appear here."}</p>
              {error ? <p role="alert" className="mt-2 text-xs text-alert-red">{error}</p> : null}
            </div>
          )}
        </section>
      </main>

      <Dialog
        isOpen={composeOpen}
        onClose={closeCompose}
        size="lg"
        title="New message"
        description="Send a message to another verified Eclipze user.">
        <MailComposeForm
          values={form}
          busy={sending}
          error={error}
          onChange={updates => setForm(current => ({ ...current, ...updates }))}
          onSubmit={sendMail}
          onCancel={closeCompose}
        />
      </Dialog>
    </DashLayout>
  );
}
