"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconArchive,
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconSearch,
  IconSend,
} from "@tabler/icons-react";

import DashLayout from "@/components/layouts/dash";
import type { IssueItem } from "@/types/issues";
import type { UserRole } from "@/types/user";
import { apiFetch } from "@/utils/api-fetch";

type IssueMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: { username: string | null; email: string; role: UserRole };
};

type IssueDetail = IssueItem & {
  requester: { username: string | null; email: string };
  messages: IssueMessage[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function InboxPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<IssueDetail | null>(null);
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyBusy, setReplyBusy] = useState(false);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/api/issues", { cache: "no-store" });
      const payload = await response.json() as { issues?: IssueItem[]; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load your inbox.");
      }

      const nextIssues = payload.issues ?? [];
      setIssues(nextIssues);
      setSelectedId(current => current || nextIssues[0]?.id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your inbox.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedIssue(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);

    async function loadSelectedIssue() {
      try {
        const response = await apiFetch(`/api/issues/${selectedId}`, { cache: "no-store" });
        const payload = await response.json() as { issue?: IssueDetail; message?: string };

        if (!response.ok || !payload.issue) {
          throw new Error(payload.message ?? "Unable to load this message.");
        }

        if (!cancelled) {
          setSelectedIssue(payload.issue);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load this message.");
          setSelectedIssue(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    void loadSelectedIssue();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filteredIssues = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return issues;

    return issues.filter(issue =>
      `${issue.title} ${issue.description ?? ""} ${issue.requester?.username ?? ""} ${issue.requester?.email ?? ""}`
        .toLocaleLowerCase()
        .includes(search),
    );
  }, [issues, query]);

  const sendReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedIssue || !reply.trim()) return;

    setReplyBusy(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/issues/${selectedIssue.id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      const payload = await response.json().catch(() => null) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to send your reply.");
      }

      setReply("");
      await Promise.all([loadIssues(), (async () => {
        const detailResponse = await apiFetch(`/api/issues/${selectedIssue.id}`, { cache: "no-store" });
        const detailPayload = await detailResponse.json() as { issue?: IssueDetail };
        if (detailResponse.ok && detailPayload.issue) setSelectedIssue(detailPayload.issue);
      })()]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send your reply.");
    } finally {
      setReplyBusy(false);
    }
  };

  const selectedIndex = issues.findIndex(issue => issue.id === selectedId);
  const selectAdjacent = (offset: number) => {
    const nextIssue = issues[selectedIndex + offset];
    if (nextIssue) setSelectedId(nextIssue.id);
  };

  return (
    <DashLayout current="inbox" router={router}>
      <main className="flex min-h-dvh min-w-0 flex-col lg:h-dvh lg:flex-row lg:overflow-hidden">
        <aside className="flex min-h-0 w-full flex-col border-b border-background-focus bg-background-card lg:w-[450px] lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="border-b border-background-focus p-[18px]">
            <label className="flex h-12 items-center gap-3 rounded-full bg-background-focus px-[18px] text-foreground-off focus-within:ring-1 focus-within:ring-accent">
              <IconSearch size={21} strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only">Search inbox</span>
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search"
                className="min-w-0 flex-1 bg-transparent text-[18px] text-foreground outline-hidden placeholder:text-foreground-off"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p role="status" className="p-6 text-[18px] text-foreground-off">Loading inbox…</p>
            ) : filteredIssues.length === 0 ? (
              <p className="p-6 text-[18px] text-foreground-off">No messages found.</p>
            ) : (
              filteredIssues.map(issue => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => setSelectedId(issue.id)}
                  aria-current={selectedId === issue.id ? "true" : undefined}
                  className={`flex w-full flex-col gap-1.5 border-b border-background-focus/70 px-6 py-[18px] text-left transition-colors hover:bg-background-focus ${selectedId === issue.id ? "bg-background-focus" : ""}`}
                >
                  <span className="truncate text-[18px] font-medium text-foreground">{issue.title}</span>
                  <span className="truncate text-[15px] text-foreground-off">{issue.requester?.username ?? issue.requester?.email ?? issue.type}</span>
                  <span className="line-clamp-2 text-[15px] leading-6 text-foreground-off">{issue.description ?? "No additional details."}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-background-focus px-6 sm:px-[30px]">
            <div className="flex items-center gap-1 text-foreground-off">
              <button type="button" onClick={() => router.push("/issues")} aria-label="Open issues" className="rounded-xs p-2.5 hover:bg-background-focus hover:text-foreground">
                <IconExternalLink size={22} strokeWidth={1.8} />
              </button>
            </div>
            <div className="flex items-center gap-1 text-foreground-off">
              <span className="mr-3 text-[15px]">{selectedIndex >= 0 ? `${selectedIndex + 1} of ${issues.length}` : ""}</span>
              <button type="button" onClick={() => selectAdjacent(-1)} disabled={selectedIndex <= 0} aria-label="Previous message" className="rounded-xs p-2.5 hover:bg-background-focus hover:text-foreground disabled:opacity-30">
                <IconChevronLeft size={22} />
              </button>
              <button type="button" onClick={() => selectAdjacent(1)} disabled={selectedIndex < 0 || selectedIndex >= issues.length - 1} aria-label="Next message" className="rounded-xs p-2.5 hover:bg-background-focus hover:text-foreground disabled:opacity-30">
                <IconChevronRight size={22} />
              </button>
            </div>
          </header>

          {error ? <p role="alert" className="border-b border-alert-red/30 px-[30px] py-3 text-[18px] text-alert-red">{error}</p> : null}

          {detailLoading ? (
            <p role="status" className="p-9 text-[21px] text-foreground-off">Loading message…</p>
          ) : selectedIssue ? (
            <article className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-[42px] lg:px-12">
              <div className="mx-auto w-full max-w-5xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="break-words text-[30px] font-medium tracking-[-0.02em] sm:text-4xl">{selectedIssue.title}</h1>
                    <p className="mt-3 text-[18px] text-foreground-off">{selectedIssue.requester?.email ?? ""}</p>
                  </div>
                  <div className="text-right text-[15px] text-foreground-off">{formatDate(selectedIssue.createdAt)}</div>
                </div>

                <div className="mt-8 space-y-8 text-[18px] leading-[1.55] text-foreground-off sm:text-[21px]">
                  {selectedIssue.description ? <p className="whitespace-pre-wrap">{selectedIssue.description}</p> : null}
                  {selectedIssue.messages.map(message => (
                    <section key={message.id} className="border-t border-background-focus pt-6">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[15px] text-foreground-off">
                        <span>{message.author.username ?? message.author.email}</span>
                        <time>{formatDate(message.createdAt)}</time>
                      </div>
                      <p className="whitespace-pre-wrap">{message.body}</p>
                    </section>
                  ))}
                </div>

                <div className="mt-9 flex justify-end">
                  <button type="button" onClick={() => router.push(`/issues/${selectedIssue.id}`)} className="inline-flex items-center gap-2 rounded-xs px-3 py-2 text-[17px] text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
                    Open issue <IconExternalLink size={20} />
                  </button>
                </div>

                <form onSubmit={sendReply} className="sticky bottom-0 mt-6 rounded-sm bg-background-card p-[18px] shadow-[0_-12px_28px_#010101] sm:p-6">
                  <label htmlFor="inbox-reply" className="sr-only">Reply to this issue</label>
                  <textarea
                    id="inbox-reply"
                    value={reply}
                    onChange={event => setReply(event.target.value)}
                    rows={3}
                    placeholder="Write a reply…"
                    className="w-full resize-y bg-transparent text-[18px] text-foreground outline-hidden placeholder:text-foreground-off"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <button type="button" onClick={() => router.push("/issues")} className="text-[15px] text-foreground-off hover:text-foreground">All issues</button>
                    <button type="submit" disabled={!reply.trim() || replyBusy} className="inline-flex items-center gap-2 rounded-xs bg-accent px-[18px] py-2 text-[17px] font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">
                      {replyBusy ? "Sending…" : "Reply"}<IconSend size={20} />
                    </button>
                  </div>
                </form>
              </div>
            </article>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-foreground-off">
                <IconArchive size={27} strokeWidth={1.6} />
              <p className="text-[21px]">Select a message to read it.</p>
              <p className="text-[18px]">{loading ? "" : "Your issue updates will appear here."}</p>
            </div>
          )}
        </section>
      </main>
    </DashLayout>
  );
}
