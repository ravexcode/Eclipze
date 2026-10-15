"use client";

// Set up
interface Props {
  profile: User
}

// Types import
import type { User } from "@/types/user";

// Icons imports
import {
  IconLogout,
  IconSettings,
  IconUserCircle
} from "@tabler/icons-react";

// Next imports
import Image from "next/image";
import Link from "next/link";

import { useRouter } from "next/navigation";

// React imports
import { useEffect, useRef, useState } from "react";

// Components imports
import { useAnnouncements } from "@/components/announcements/announcement-provider";

// Utils imports
import { apiFetch } from "@/utils/api-fetch";
import { invalidateSessionUser } from "@/utils/session";

const MENU_EXIT_DURATION_MS = 150;

export default function UserProfile({ profile }: Props) {
  const router = useRouter();
  const { announce } = useAnnouncements();
  const [visible, setVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      return;
    }

    const unmountTimer = window.setTimeout(() => setIsMounted(false), MENU_EXIT_DURATION_MS);
    return () => window.clearTimeout(unmountTimer);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setVisible(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisible(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [visible]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await apiFetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to log out. Please try again.");
      }

      invalidateSessionUser();
      router.replace("/auth/signin");
      router.refresh();
    } catch (error) {
      announce({
        message: error instanceof Error ? error.message : "Unable to log out. Please try again.",
        variant: "error",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Constants
  const avatarClass = "aspect-square w-6 rounded-full";

  return (
    <section
      ref={containerRef}
      className="w-full relative mt-auto">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={visible}
        className="w-full rounded-md hover:bg-background-focus cursor-pointer p-2 flex gap-2 items-center justify-start"
        onClick={() => setVisible(prev => !prev)} >
        {
          profile.avatar ?
            <Image
              src={profile.avatar}
              alt={profile.name + " avatar profile"}
              width={30}
              height={30}
              className={avatarClass}
              unoptimized /> :
            <IconUserCircle
              size={20}
              stroke={1.5}
              className={avatarClass} />
        }

        <p
          className="w-full text-xs text-start">
          {profile.name}
        </p>
      </button>

      {isMounted ? (
        <div
          role="menu"
          className={`${visible ? "menu-enter" : "menu-exit"} absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-md border border-background-focus bg-background-card text-xs shadow-2xl`}>
          <div className="flex items-center gap-2.5 border-b border-background-focus p-3">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt=""
                width={36}
                height={36}
                className="aspect-square w-9 rounded-full"
                unoptimized />
            ) : (
              <IconUserCircle size={36} stroke={1.2} className="text-foreground-off" />
            )}
            <div className="min-w-0">
              <p className="truncate text-foreground">{profile.name}</p>
              <p className="mt-0.5 text-foreground-off">
                {profile.role === "DEVELOPER" ? "Developer" : "Member"}
              </p>
            </div>
          </div>

          <div className="p-1">
            <Link
              href="/profile/settings"
              role="menuitem"
              onClick={() => setVisible(false)}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
              <IconSettings size={15} stroke={1.8} />
              Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-foreground-off transition-colors hover:bg-background-focus hover:text-priority-high disabled:opacity-50">
              <IconLogout size={15} stroke={1.8} />
              {isLoggingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
