"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";
import { apiFetch } from "@/utils/api-fetch";
import type { UserRole } from "@/types/user";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type ManagedUser = { id: string; email: string; username: string | null; role: UserRole; createdAt: string };

export default function DeveloperUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await apiFetch(`/api/developer/users?q=${encodeURIComponent(query)}`);
    const data = await response.json().catch(() => null) as { users?: ManagedUser[]; message?: string } | null;
    if (!response.ok) { setError(data?.message ?? "Developer access required."); return; }
    setUsers(data?.users ?? []);
  }, [query]);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  const updateRole = async (user: ManagedUser) => {
    const role: UserRole = user.role === "DEVELOPER" ? "USER" : "DEVELOPER";
    const response = await apiFetch(`/api/developer/users/${user.id}/role`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ role }) });
    const data = await response.json().catch(() => null) as { message?: string } | null;
    if (!response.ok) { setError(data?.message ?? "Unable to update access."); return; }
    await load();
  };

  return <DashLayout current="issues" router={router}><main className="w-full min-w-0"><Heading label="Developer access" /><div className="mx-auto flex w-full max-w-220 flex-col gap-5 p-4 md:p-8"><div><p className="text-xl font-medium">Manage profiles</p><p className="mt-1 text-sm text-foreground-off">Only Developers can grant or remove global issue access.</p></div><div className="flex gap-2"><input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void load(); }} className="w-full rounded-sm bg-background-card px-3 py-2 text-sm outline-hidden" placeholder="Search by email or username" /><button type="button" onClick={() => void load()} className="rounded-sm bg-accent px-4 py-2 text-sm">Search</button></div>{error && <p role="alert" className="rounded-sm border border-priority-high bg-background-card p-3 text-sm text-priority-high">{error}</p>}<div className="flex flex-col gap-2">{users.map(user => <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-background-card p-4"><div><p className="text-sm font-medium">{user.username ?? user.email}</p><p className="text-xs text-foreground-off">{user.email}</p></div><button type="button" onClick={() => void updateRole(user)} className="rounded-sm bg-background-focus px-3 py-2 text-xs hover:bg-accent">{user.role === "DEVELOPER" ? "Make User" : "Make Developer"}</button></div>)}</div></div></main></DashLayout>;
}
