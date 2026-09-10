"use client";

import { useEffect, useState, type ReactNode } from "react";

import Sidebar from "@/components/sidebar";

import type { SessionUser, UserProfile } from "@/types/user";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname } from "next/navigation";

import CacheDB from "@/utils/cache";

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
      const cached = CacheDB.get();

      if (cached.user) {
        setUser({
          name: cached.user.name,
          avatar: cached.user.avatar,
          id: cached.user.id
        });

        return;
      } else {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          props.router.replace("/auth/signin");
          return;
        }

        const data = await response.json() as {
          user: SessionUser;
        };

        if (cancelled) {
          return;
        }

        CacheDB.update({
          name: data.user.displayName,
          avatar: data.user.avatarUrl ?? "/logo.svg",
          id: data.user.id,
        });

        setUser({
          name: data.user.displayName,
          avatar: data.user.avatarUrl ?? "/logo.svg",
          id: data.user.id,
        });

        return;
      }
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
