"use client";

import { useEffect, useState, type ReactNode } from "react";
import { IconLayoutSidebarRightExpand } from "@tabler/icons-react";

import Sidebar from "@/components/sidebar";
import WorkspaceSidebar from "@/components/layouts/workspace-sidebar";

import type { UserProfile } from "@/types/user";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname } from "next/navigation";

import { getSessionUser } from "@/utils/session";

interface Props {
  current: "overview" | "inbox" | "issues" | "agents" | "projects" | "settings";
  router: AppRouterInstance;
  children?: ReactNode;
}

const USER_UPDATED_EVENT = "user-updated";

export default function DashLayout(props: Props) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile>();
  const [reloadToken, setReloadToken] = useState(0);
  const [showWorkspaceSidebar, setShowWorkspaceSidebar] = useState(true);
  const isAgentRoute = pathname === "/agents" || pathname.startsWith("/agents/");

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
      const sessionUser = await getSessionUser();

      if (!sessionUser) {
        props.router.replace("/auth/signin");
        return;
      }

      if (cancelled) return;

      setUser({
        name: sessionUser.displayName,
        avatar: sessionUser.avatarUrl ?? "/logo.svg",
        id: sessionUser.id,
        role: sessionUser.role,
      });
    };

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [pathname, props.router, reloadToken]);

  return (
    <div className={`grid min-h-dvh w-full grid-cols-1 items-start bg-background text-foreground md:grid-cols-[auto_minmax(0,1fr)] ${isAgentRoute && showWorkspaceSidebar ? "xl:grid-cols-[auto_minmax(0,1fr)_250px]" : ""}`}>
      <Sidebar
        selected={props.current}
        user={user}
        router={props.router} />
      <div className="relative min-w-0">
        {isAgentRoute && !showWorkspaceSidebar ? (
          <button type="button" onClick={() => setShowWorkspaceSidebar(true)} aria-label="Show right sidebar" className="absolute right-3 top-2 z-20 rounded-xs bg-surface p-2 text-foreground-off hover:bg-surface-raised hover:text-foreground">
            <IconLayoutSidebarRightExpand size={17} strokeWidth={1.8} />
          </button>
        ) : null}
        {props.children}
      </div>
      {isAgentRoute && showWorkspaceSidebar ? (
        <WorkspaceSidebar onCollapse={() => setShowWorkspaceSidebar(false)} />
      ) : null}
    </div>
  );
}
