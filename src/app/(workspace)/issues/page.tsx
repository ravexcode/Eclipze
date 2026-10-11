"use client";

import { useCallback, useMemo, useState, type SubmitEvent } from "react";

import IssueFilters from "@/components/issues/issue-filters";
import IssueForm from "@/components/issues/issue-form";
import IssueResults from "@/components/issues/issue-results";
import IssueToolbar from "@/components/issues/issue-toolbar";
import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";
import { initialIssueForm } from "@/constants/issues";
import type { IssueFormValues, IssueItem } from "@/types/issues";
import type { IssueStatus, IssueType, UserRole } from "@/types/user";
import { apiFetch } from "@/utils/api-fetch";
import { IssuesCache } from "@/utils/cache";
import { filterIssues } from "@/utils/issues";
import { refreshSessionUser } from "@/utils/session";
import { useIssueRefresh } from "@/utils/use-issue-refresh";
import { useRouter } from "next/navigation";

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
  const [form, setForm] = useState<IssueFormValues>(initialIssueForm);
  const clearIssues = useCallback(() => {
    setIssues([]);
    setUnread(0);
    setRole("USER");
    setShowForm(false);
    setForm({ ...initialIssueForm });
  }, []);

  const refresh = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const sessionUser = await refreshSessionUser();
      if (signal.aborted) return;
      if (!sessionUser) {
        clearIssues();
        return;
      }
      setRole(sessionUser.role);
      const [issueResponse, notificationResponse] = await Promise.all([
        apiFetch("/api/issues", { signal }),
        apiFetch("/api/notifications?countOnly=true", { signal }),
      ]);
      if (!issueResponse.ok || !notificationResponse.ok) {
        throw new Error("Unable to load issues.");
      }
      const data = await issueResponse.json() as { issues: IssueItem[] };
      const notifications = await notificationResponse.json() as { unread: number };
      if (signal.aborted) return;
      setIssues(data.issues);
      setUnread(notifications.unread);
      IssuesCache.update(sessionUser.id, sessionUser.role, data.issues, notifications.unread, "all-issues");
    } catch (loadError) {
      if (signal.aborted) return;
      clearIssues();
      setError(loadError instanceof Error ? loadError.message : "Unable to load issues.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [clearIssues]);

  const load = useIssueRefresh(refresh, clearIssues);

  const filteredIssues = useMemo(
    () => filterIssues(issues, query, status, type),
    [issues, query, status, type],
  );

  const createIssue = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const response = await apiFetch("/api/issues", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    if (!response.ok) {
      setError(data?.message ?? "Unable to create issue.");
      return;
    }

    setForm({ ...initialIssueForm });
    setShowForm(false);

    await load(true);
  };

  return (
    <DashLayout
      current="issues"
      router={router}>
      <main
        className="w-full min-w-0">
        <Heading label="Issues" />

        <div
          className="mx-auto flex w-full max-w-350 flex-col gap-5 p-4 md:p-6">
          <IssueToolbar
            unread={unread}
            loading={loading}
            onRefresh={() => void load(true)}
            onCreateIssue={() => setShowForm((value) => !value)}
          />

          {showForm && (
            <IssueForm
              form={form}
              onChange={(updates) =>
                setForm((previous) => ({ ...previous, ...updates }))
              }
              onSubmit={createIssue}
              onCancel={() => setShowForm(false)}
            />
          )}

          <IssueFilters
            query={query}
            status={status}
            type={type}
            onQueryChange={setQuery}
            onStatusChange={setStatus}
            onTypeChange={setType}
          />

          <IssueResults
            error={error}
            loading={loading}
            issues={filteredIssues}
            role={role}
            onOpenIssue={(issueId) => router.push(`/issues/${issueId}`)}
          />
        </div>
      </main>
    </DashLayout>
  );
}
