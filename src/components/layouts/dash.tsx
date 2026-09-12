"use client";

import { useEffect, useState, type ReactNode } from "react";

import Sidebar from "@/components/sidebar";

import type { SessionUser, UserProfile, WorkspaceSnapshot } from "@/types/user";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname } from "next/navigation";

import CacheDB from "@/utils/cache";
import { apiFetch } from "@/utils/api-fetch";

interface Props {
  current: "overview" | "mails" | "issues" | "agents" | "projects" | "settings";
  router: AppRouterInstance;
  children?: ReactNode;
}

const USER_UPDATED_EVENT = "user-updated";

export default function DashLayout(props: Props) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile>();
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const handleUserUpdated = () => {
      setReloadToken(previous => previous + 1);
    };

    window.addEventListener(USER_UPDATED_EVENT, handleUserUpdated);

    return () => {
      window.removeEventListener(USER_UPDATED_EVENT, handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser = async () => {
      const authResponse = await apiFetch("/api/auth/me", {
        credentials: "include",
      });

      if (!authResponse.ok) {
        CacheDB.delete();
        props.router.replace("/auth/signin");
        return;
      }

      const authData = await authResponse.json() as { user: SessionUser };
      const cached = CacheDB.get(authData.user.id);
      let workspace = cached.workspace;

      if (!workspace) {
        const workspaceResponse = await apiFetch("/api/workspace", {
          credentials: "include",
        });

        if (!workspaceResponse.ok) {
          props.router.replace("/auth/signin");
          return;
        }

        workspace = await workspaceResponse.json() as WorkspaceSnapshot;
        CacheDB.update(workspace);
      }

      if (cancelled) return;

      setUser({
        name: workspace.user.displayName,
        avatar: workspace.user.avatarUrl ?? "/logo.svg",
        id: workspace.user.id,
      });
    };

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [pathname, props.router, reloadToken]);

  return (
    <div className="min-h-dvh w-full grid grid-cols-[auto_1fr] bg-background text-foreground">
      <Sidebar
        selected={props.current}
        user={user}
        router={props.router} />
      {props.children}
    </div>
  );
}
