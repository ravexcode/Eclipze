"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashLayout from "@/components/layouts/dash";
import OverviewDashboard from "@/components/overview/dashboard";
import { apiFetch } from "@/utils/api-fetch";
import type { WorkspaceSnapshot } from "@/types/user";

export default function OverviewPage() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch("/api/workspace");

        if (!res.ok) {
          if (!cancelled) setError("Workspace not found");
          return;
        }

        const workspace = await res.json() as WorkspaceSnapshot;
        if (!cancelled) setSnapshot(workspace);
      } catch {
        if (!cancelled) setError("Unable to load workspace.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [router]);

  return (
    <DashLayout current="overview" router={router}>
      <OverviewDashboard
        snapshot={snapshot}
        loading={loading}
        error={error}
        onOpenIssue={issue => router.push(`/issues/${issue.id}`)}
        onOpenInbox={() => router.push("/inbox")}
      />
    </DashLayout>
  );
}
