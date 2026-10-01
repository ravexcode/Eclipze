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

    const loadWorkspace = async () => {
      try {
        const response = await apiFetch("/api/workspace");

        if (!response.ok) {
          throw new Error("Could not load workspace activity.");
        }

        const workspace = await response.json() as WorkspaceSnapshot;

        if (!cancelled) {
          setSnapshot(workspace);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error
            ? loadError.message
            : "Could not load workspace activity.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashLayout current="overview" router={router}>
      <OverviewDashboard
        snapshot={snapshot}
        loading={loading}
        error={error}
        onOpenIssue={issue => router.push(`/issues/${issue.id}`)}
        onOpenIssues={() => router.push("/issues")}
      />
    </DashLayout>
  );
}
