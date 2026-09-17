"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";
import { apiFetch } from "@/utils/api-fetch";
import { IssuesCache } from "@/utils/cache";
import { getSessionUser } from "@/utils/session";
import type { IssuePriority, IssueStatus, IssueType, UserRole } from "@/types/user";
import { IconBell, IconPlus, IconRefresh, IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type IssueItem = {
  id: string;
  title: string;
  description: string | null;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  lastActivityAt: string;
  createdAt: string;
  requester?: { id: string; username: string | null; email: string };
};

const typeLabels: Record<IssueType, string> = { BUG: "Bug", FEATURE: "Feature", SUPPORT: "Support" };
const statusLabels: Record<IssueStatus, string> = { OPEN: "Open", IN_PROGRESS: "In progress", WAITING_FOR_USER: "Waiting for user", RESOLVED: "Resolved", CLOSED: "Closed" };
const priorityLabels: Record<IssuePriority, string> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
const priorityClasses: Record<IssuePriority, string> = { HIGH: "text-priority-high", MEDIUM: "text-priority-medium", LOW: "text-priority-low" };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function IssuesPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [role, setRole] = useState<UserRole>("USER");
  const [unread, setUnread] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | IssueStatus>("ALL");
  const [type, setType] = useState<"ALL" | IssueType>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", type: "SUPPORT" as IssueType, priority: "MEDIUM" as IssuePriority });
  const loadPromise = useRef<Promise<void> | null>(null);

  const load = useCallback(async (force = false) => {
    if (loadPromise.current) return loadPromise.current;

    const promise = (async () => {
      setLoading(true);
      setError(null);
      try {
        const sessionUser = await getSessionUser();
        if (!sessionUser) return;
        setRole(sessionUser.role);

        if (!force) {
          const cached = IssuesCache.get<IssueItem>(sessionUser.id, sessionUser.role);
          if (cached) {
            setIssues(cached.issues);
            setUnread(cached.unread);
            return;
          }
        }

        const [issueResponse, notificationResponse] = await Promise.all([
          apiFetch("/api/issues"),
          apiFetch("/api/notifications"),
        ]);
        if (!issueResponse.ok) throw new Error("Unable to load issues.");
        const data = await issueResponse.json() as { issues: IssueItem[] };
        const nextUnread = notificationResponse.ok ? (await notificationResponse.json() as { unread: number }).unread : 0;
        setIssues(data.issues);
        setUnread(nextUnread);
        IssuesCache.update(sessionUser.id, sessionUser.role, data.issues, nextUnread);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load issues.");
      } finally {
        setLoading(false);
      }
    })();

    loadPromise.current = promise;
    try {
      await promise;
    } finally {
      if (loadPromise.current === promise) loadPromise.current = null;
    }
  }, []);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  const filteredIssues = useMemo(() => issues.filter(item => {
    const matchesQuery = !query.trim() || `${item.title} ${item.description ?? ""} ${item.requester?.username ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (status === "ALL" || item.status === status) && (type === "ALL" || item.type === type);
  }), [issues, query, status, type]);

  const createIssue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const response = await apiFetch("/api/issues", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => null) as { message?: string } | null;
    if (!response.ok) { setError(data?.message ?? "Unable to create issue."); return; }
    setForm({ title: "", description: "", type: "SUPPORT", priority: "MEDIUM" });
    setShowForm(false);
    const sessionUser = await getSessionUser();
    IssuesCache.delete(sessionUser?.id);
    await load(true);
  };

  return (
    <DashLayout current="issues" router={router}>
      <main className="w-full min-w-0">
        <Heading label="Issues" />
        <div className="mx-auto flex w-full max-w-350 flex-col gap-5 p-4 md:p-6">
          <section className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xl font-medium">{role === "DEVELOPER" ? "All user issues" : "Your issues"}</p>
              <p className="mt-1 text-sm text-foreground-off">Track bugs, ideas, and support conversations in one place.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-sm bg-background-card px-3 py-2 text-xs text-foreground-off" title="Unread notifications">
                <IconBell size={15} /> {unread}
              </span>
              <button type="button" onClick={() => void load(true)} disabled={loading} className="rounded-sm bg-background-card p-2 text-foreground-off hover:bg-background-focus disabled:opacity-50" aria-label="Refresh issues" title="Refresh from server"><IconRefresh size={17} /></button>
              {role === "DEVELOPER" && <button type="button" onClick={() => router.push("/developer/users")} className="rounded-sm bg-background-card px-3 py-2 text-xs text-foreground-off hover:bg-background-focus">Manage access</button>}
              {role === "USER" && <button type="button" onClick={() => setShowForm(value => !value)} className="flex items-center gap-2 rounded-sm bg-accent px-3 py-2 text-sm hover:brightness-125"><IconPlus size={16} /> New issue</button>}
            </div>
          </section>

          {showForm && <form onSubmit={createIssue} className="flex flex-col gap-4 rounded-sm bg-background-card p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
              <label className="flex flex-col gap-2 text-sm">Title<input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} className="rounded-sm bg-background-focus px-3 py-2 text-foreground outline-hidden" placeholder="What do you need help with?" /></label>
              <label className="flex flex-col gap-2 text-sm">Type<select value={form.type} onChange={event => setForm({ ...form, type: event.target.value as IssueType })} className="rounded-sm bg-background-focus px-3 py-2 text-foreground outline-hidden"><option value="SUPPORT">Support</option><option value="BUG">Bug</option><option value="FEATURE">Feature</option></select></label>
              <label className="flex flex-col gap-2 text-sm">Priority<select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value as IssuePriority })} className="rounded-sm bg-background-focus px-3 py-2 text-foreground outline-hidden"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label>
            </div>
            <label className="flex flex-col gap-2 text-sm">Description<textarea required minLength={5} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className="min-h-28 resize-y rounded-sm bg-background-focus px-3 py-2 text-foreground outline-hidden" placeholder="Describe the issue with enough context for the team." /></label>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-sm px-3 py-2 text-sm text-foreground-off hover:bg-background-focus">Cancel</button><button type="submit" className="rounded-sm bg-accent px-3 py-2 text-sm hover:brightness-125">Submit issue</button></div>
          </form>}

          <section className="flex flex-wrap gap-2 rounded-sm bg-background-card p-3">
            <label className="flex min-w-56 flex-1 items-center gap-2 rounded-sm bg-background-focus px-3 py-2 text-sm text-foreground-off"><IconSearch size={16} /><input value={query} onChange={event => setQuery(event.target.value)} className="w-full bg-transparent text-foreground outline-hidden" placeholder="Search issues" /></label>
            <select value={status} onChange={event => setStatus(event.target.value as typeof status)} className="rounded-sm bg-background-focus px-3 py-2 text-sm text-foreground outline-hidden"><option value="ALL">All statuses</option>{Object.keys(statusLabels).map(value => <option key={value} value={value}>{statusLabels[value as IssueStatus]}</option>)}</select>
            <select value={type} onChange={event => setType(event.target.value as typeof type)} className="rounded-sm bg-background-focus px-3 py-2 text-sm text-foreground outline-hidden"><option value="ALL">All types</option>{Object.keys(typeLabels).map(value => <option key={value} value={value}>{typeLabels[value as IssueType]}</option>)}</select>
          </section>

          {error && <p role="alert" className="rounded-sm border border-priority-high bg-background-card p-3 text-sm text-priority-high">{error}</p>}
          {loading ? <p className="py-8 text-sm text-foreground-off">Loading issues…</p> : filteredIssues.length === 0 ? <div className="rounded-sm bg-background-card p-8 text-center"><p className="text-lg">No issues found</p><p className="mt-2 text-sm text-foreground-off">Create an issue when you need help or want to propose a feature.</p></div> : <div className="flex flex-col gap-2">{filteredIssues.map(item => <button key={item.id} type="button" onClick={() => router.push(`/issues/${item.id}`)} className="flex w-full flex-col gap-3 rounded-sm bg-background-card p-4 text-left hover:bg-background-focus md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-base font-medium">{item.title}</span><span className="text-xs text-foreground-off">{typeLabels[item.type]}</span>{role === "DEVELOPER" && item.requester && <span className="text-xs text-foreground-off">by {item.requester.username ?? item.requester.email}</span>}</div><p className="mt-1 line-clamp-2 text-sm text-foreground-off">{item.description}</p><p className="mt-2 text-xs text-foreground-off">Updated {dateLabel(item.lastActivityAt)}</p></div><div className="flex shrink-0 items-center gap-3 text-xs"><span className={priorityClasses[item.priority]}>{priorityLabels[item.priority]}</span><span className="text-foreground-off">{statusLabels[item.status]}</span></div></button>)}</div>}
        </div>
      </main>
    </DashLayout>
  );
}
