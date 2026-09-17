"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";
import { apiFetch } from "@/utils/api-fetch";
import { IssuesCache } from "@/utils/cache";
import { getSessionUser } from "@/utils/session";
import type { IssuePriority, IssueStatus, IssueType, UserRole } from "@/types/user";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Detail = {
  id: string; title: string; description: string | null; type: IssueType; priority: IssuePriority; status: IssueStatus; createdAt: string; updatedAt: string; requester: { id: string; username: string | null; email: string };
  messages: Array<{ id: string; body: string; createdAt: string; author: { id: string; username: string | null; email: string; role: UserRole } }>;
};

const statuses: Array<[IssueStatus, string]> = [["OPEN", "Open"], ["IN_PROGRESS", "In progress"], ["WAITING_FOR_USER", "Waiting for user"], ["RESOLVED", "Resolved"], ["CLOSED", "Closed"]];
const priorities: Array<[IssuePriority, string]> = [["LOW", "Low"], ["MEDIUM", "Medium"], ["HIGH", "High"]];

function dateLabel(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export default function IssueDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<Detail | null>(null);
  const [role, setRole] = useState<UserRole>("USER");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [response, notificationResponse] = await Promise.all([
      apiFetch(`/api/issues/${params.id}`),
      apiFetch("/api/notifications"),
    ]);
    const data = await response.json().catch(() => null) as { issue?: Detail; message?: string } | null;
    if (!response.ok || !data?.issue) setError(data?.message ?? "Unable to load issue."); else setRequest(data.issue);
    if (notificationResponse.ok) {
      const notifications = await notificationResponse.json() as { notifications?: Array<{ id: string; issueId: string | null; readAt: string | null }> };
      await Promise.all((notifications.notifications ?? []).filter(notification => notification.issueId === params.id && !notification.readAt).map(notification => apiFetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: notification.id }) })));
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => { queueMicrotask(() => { void getSessionUser().then(user => { if (user) setRole(user.role); }); void load(); }); }, [load]);

  const update = async (field: "status" | "priority", value: string) => {
    const response = await apiFetch(`/api/issues/${params.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    if (!response.ok) { const data = await response.json().catch(() => null) as { message?: string } | null; setError(data?.message ?? "Unable to update issue."); return; }
    const sessionUser = await getSessionUser();
    IssuesCache.delete(sessionUser?.id);
    await load();
  };

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!body.trim()) return;
    const response = await apiFetch(`/api/issues/${params.id}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) });
    if (!response.ok) { const data = await response.json().catch(() => null) as { message?: string } | null; setError(data?.message ?? "Unable to send message."); return; }
    setBody("");
    const sessionUser = await getSessionUser();
    IssuesCache.delete(sessionUser?.id);
    await load();
  };

  return <DashLayout current="issues" router={router}><main className="w-full min-w-0"><Heading label="Issues" /><div className="mx-auto flex w-full max-w-250 flex-col gap-5 p-4 md:p-8">{loading ? <p className="py-8 text-sm text-foreground-off">Loading issue…</p> : !request ? <p role="alert" className="text-priority-high">{error ?? "Issue not found."}</p> : <>
    <button type="button" onClick={() => router.push("/issues")} className="w-max text-sm text-foreground-off hover:text-foreground">← Back to issues</button>
    <section className="flex flex-col gap-4 rounded-sm bg-background-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.12em] text-foreground-off">{request.type}</p><h1 className="mt-1 text-2xl font-medium">{request.title}</h1><p className="mt-2 text-sm text-foreground-off">Requested by {request.requester.username ?? request.requester.email} · {dateLabel(request.createdAt)}</p></div><div className="flex flex-wrap gap-3 text-sm"><span className="text-foreground-off">{request.priority}</span><span className="text-foreground-off">{request.status}</span></div></div><p className="whitespace-pre-wrap text-sm leading-6 text-foreground-off">{request.description}</p>{role === "DEVELOPER" && <div className="flex flex-wrap gap-2 border-t border-background-focus pt-4"><label className="flex items-center gap-2 text-xs text-foreground-off">Priority<select value={request.priority} onChange={event => void update("priority", event.target.value)} className="rounded-sm bg-background-focus px-2 py-1 text-foreground outline-hidden">{priorities.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="flex items-center gap-2 text-xs text-foreground-off">Status<select value={request.status} onChange={event => void update("status", event.target.value)} className="rounded-sm bg-background-focus px-2 py-1 text-foreground outline-hidden">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>}</section>
    {error && <p role="alert" className="rounded-sm border border-priority-high bg-background-card p-3 text-sm text-priority-high">{error}</p>}
    <section className="flex flex-col gap-3"><h2 className="text-lg font-medium">Conversation</h2>{request.messages.length === 0 ? <p className="rounded-sm bg-background-card p-5 text-sm text-foreground-off">No replies yet.</p> : request.messages.map(message => <article key={message.id} className="rounded-sm bg-background-card p-4"><div className="flex flex-wrap justify-between gap-2 text-xs text-foreground-off"><span>{message.author.username ?? message.author.email} · {message.author.role === "DEVELOPER" ? "Developer" : "User"}</span><time>{dateLabel(message.createdAt)}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{message.body}</p></article>)}</section>
    <form onSubmit={sendMessage} className="flex flex-col gap-3 rounded-sm bg-background-card p-4"><label className="text-sm font-medium" htmlFor="request-message">Add a reply</label><textarea id="request-message" required value={body} onChange={event => setBody(event.target.value)} className="min-h-28 resize-y rounded-sm bg-background-focus px-3 py-2 text-sm outline-hidden" placeholder="Write a response…" /><button type="submit" className="self-end rounded-sm bg-accent px-4 py-2 text-sm hover:brightness-125">Send reply</button></form>
  </>}</div></main></DashLayout>;
}
