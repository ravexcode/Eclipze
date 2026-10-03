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
    (async () => {
      const res = await apiFetch("/api/workspace");

      if (!res.ok) {
        setError("Workspace not found");
        return router.push("/auth");
      };

      const workspace = await res.json() as WorkspaceSnapshot;
      setSnapshot(workspace);
      setLoading(false);
    })();
  }, [router]);

  return (
    <DashLayout current="overview" router={router}>
      <OverviewDashboard
        snapshot={snapshot}
        loading={loading}
        error={error}
        onOpenIssue={issue => router.push(`/issues/${issue.id}`)}
        onOpenIssues={() => router.push("/inbox")}
      />
    </DashLayout>
  );
}
