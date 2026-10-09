"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type SubmitEvent } from "react";

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
import { getSessionUser } from "@/utils/session";
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
          const cached = IssuesCache.get<IssueItem>(
            sessionUser.id,
            sessionUser.role,
          );

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

        if (!issueResponse.ok) {
          throw new Error("Unable to load issues.");
        }

        const data = (await issueResponse.json()) as {
          issues: IssueItem[];
        };
        const nextUnread = notificationResponse.ok
          ? ((await notificationResponse.json()) as { unread: number }).unread
          : 0;

        setIssues(data.issues);
        setUnread(nextUnread);
        IssuesCache.update(
          sessionUser.id,
          sessionUser.role,
          data.issues,
          nextUnread,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load issues.",
        );
      } finally {
        setLoading(false);
      }
    })();

    loadPromise.current = promise;

    try {
      await promise;
    } finally {
      if (loadPromise.current === promise) {
        loadPromise.current = null;
      }
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

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

    const sessionUser = await getSessionUser();
    IssuesCache.delete(sessionUser?.id);
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
            role={role}
            unread={unread}
            loading={loading}
            onRefresh={() => void load(true)}
            onManageAccess={() => router.push("/developer/users")}
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
