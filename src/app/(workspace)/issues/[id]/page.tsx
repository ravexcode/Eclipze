"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";
import Input from "@/components/ui/input";
import MenuSelector from "@/components/ui/menu-selector";
import { ISSUE_PRIORITY_OPTIONS, ISSUE_STATUS_OPTIONS } from "@/constants/issues";
import { apiFetch } from "@/utils/api-fetch";
import { refreshSessionUser } from "@/utils/session";
import { useIssueRefresh } from "@/utils/use-issue-refresh";
import type {
  IssuePriority,
  IssueStatus,
  IssueType,
  UserRole,
} from "@/types/user";

type Detail = {
  id: string;
  title: string;
  description: string | null;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  requester: { id: string; username: string | null; email: string };
  messages: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: {
      id: string;
      username: string | null;
      email: string;
      role: UserRole;
    };
  }>;
};

const ISSUE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function dateLabel(value: string) {
  return ISSUE_DATE_FORMATTER.format(new Date(value));
}

export default function IssueDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<Detail | null>(null);
  const [role, setRole] = useState<UserRole>("USER");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearIssue = useCallback(() => {
    setRequest(null);
    setRole("USER");
    setBody("");
  }, []);

  const refresh = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try {
      const user = await refreshSessionUser();
      if (signal.aborted) return;
      if (!user) {
        clearIssue();
        return;
      }
      const response = await apiFetch(`/api/issues/${params.id}`, { signal });
      const data = await response.json().catch(() => null) as {
        issue?: Detail;
        message?: string;
      } | null;
      if (signal.aborted) return;
      if (!response.ok || !data?.issue) {
        clearIssue();
        setError(data?.message ?? "Unable to load issue.");
        return;
      }
      setError(null);
      setRole(user.role);
      setRequest(data.issue);
      await apiFetch("/api/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ issueId: params.id }),
        signal,
      }, { invalidatePrivateCache: false });
    } catch (loadError) {
      if (signal.aborted) return;
      clearIssue();
      setError(loadError instanceof Error ? loadError.message : "Unable to load issue.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [clearIssue, params.id]);

  const load = useIssueRefresh(refresh, clearIssue);

  const update = async (field: "status" | "priority", value: string) => {
    const response = await apiFetch(`/api/issues/${params.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(data?.message ?? "Unable to update issue.");
      return;
    }

    await load();
  };

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!body.trim()) return;

    const response = await apiFetch(`/api/issues/${params.id}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(data?.message ?? "Unable to send message.");
      return;
    }

    setBody("");
    await load();
  };

  return (
    <DashLayout current="issues" router={router}>
      <main className="w-full min-w-0">
        <Heading label="Issues" />
        <div className="mx-auto flex w-full max-w-250 flex-col gap-5 p-4 md:p-8">
          {loading ? (
            <p role="status" className="py-8 text-xs text-foreground-off">
              Loading issue…
            </p>
          ) : !request ? (
            <p role="alert" className="text-xs text-priority-high">
              {error ?? "Issue not found."}
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => router.push("/issues")}
                className="w-max rounded-md text-xs text-foreground-off hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
                ← Back to issues
              </button>

              <section className="flex flex-col gap-5 rounded-md border border-background-focus bg-background-card p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-foreground-off">
                      {request.type}
                    </p>
                    <h1 className="mt-1 break-words text-lg font-medium tracking-[-0.02em]">
                      {request.title}
                    </h1>
                    <p className="mt-2 text-xs text-foreground-off">
                      Requested by {request.requester.username ?? request.requester.email}
                      <span aria-hidden="true"> · </span>
                      {dateLabel(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-off">
                    <span>{request.priority}</span>
                    <span>{request.status.replaceAll("_", " ")}</span>
                  </div>
                </div>

                {request.description ? (
                  <p className="whitespace-pre-wrap border-t border-background-focus pt-4 text-xs leading-6 text-foreground-off">
                    {request.description}
                  </p>
                ) : null}

                {role === "DEVELOPER" ? (
                  <div className="flex flex-wrap gap-4 border-t border-background-focus pt-4">
                    <div className="flex items-center gap-2 text-xs text-foreground-off">
                      <p>Priority</p>
                      <MenuSelector
                        ariaLabel="Priority"
                        value={request.priority}
                        onChange={(priority) => void update("priority", priority)}
                        options={ISSUE_PRIORITY_OPTIONS}
                        placeholder="Select a priority"
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground-off">
                      <p>Status</p>
                      <MenuSelector
                        ariaLabel="Status"
                        value={request.status}
                        onChange={(status) => void update("status", status)}
                        options={ISSUE_STATUS_OPTIONS}
                        placeholder="Select a status"
                        className="w-44"
                      />
                    </div>
                  </div>
                ) : null}
              </section>

              {error ? (
                <p
                  role="alert"
                  className="rounded-md border border-priority-high/50 bg-background-card p-3 text-xs text-priority-high">
                  {error}
                </p>
              ) : null}

              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-medium">Conversation</h2>
                {request.messages.length === 0 ? (
                  <p className="rounded-md border border-background-focus bg-background-card p-5 text-xs text-foreground-off">
                    No replies yet.
                  </p>
                ) : (
                  request.messages.map((message) => (
                    <article
                      key={message.id}
                      className="rounded-md border border-background-focus bg-background-card p-4">
                      <div className="flex flex-wrap justify-between gap-2 text-xs text-foreground-off">
                        <span>
                          {message.author.username ?? message.author.email}
                          <span aria-hidden="true"> · </span>
                          {message.author.role === "DEVELOPER"
                            ? "Developer"
                            : "User"}
                        </span>
                        <time>{dateLabel(message.createdAt)}</time>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-xs leading-6">
                        {message.body}
                      </p>
                    </article>
                  ))
                )}
              </section>

              <form
                onSubmit={sendMessage}
                className="flex flex-col gap-3 rounded-md border border-background-focus bg-background-card p-4">
                <label
                  className="text-xs font-medium"
                  htmlFor="request-message">
                  Add a reply
                </label>
                <Input
                  type="textarea"
                  id="request-message"
                  required
                  rows={5}
                  value={body}
                  onChange={setBody}
                  placeholder="Write a response…"
                />
                <button
                  type="submit"
                  className="self-end rounded-md bg-accent px-3 py-1.5 text-xs transition-colors hover:bg-accent-strong focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
                  Send reply
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </DashLayout>
  );
}
