"use client";

import { useEffect, useState, type ReactNode } from "react";

import Sidebar from "@/components/sidebar";
import type { SessionUser } from "@/types/user";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname } from "next/navigation";

interface Props {
  current: "overview" | "mails" | "issues" | "agents" | "projects" | "settings";
  router: AppRouterInstance;
  children?: ReactNode;
}

const fallbackUser = {
  name: "Eclipse user",
  avatar: "/logo.svg",
  id: "",
};

const USER_UPDATED_EVENT = "user-updated";

export default function DashLayout(props: Props) {
  const pathname = usePathname();
  const [user, setUser] = useState(fallbackUser);
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

      setUser({
        name: data.user.displayName,
        avatar: data.user.avatarUrl ?? "/logo.svg",
        id: data.user.id,
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
