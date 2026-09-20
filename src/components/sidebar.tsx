"use client";

import {
  IconBrain,
  IconChevronDown,
  IconFolders,
  IconLayoutDashboard,
  IconLayoutSidebar,
  IconLogout2,
  IconPointer2,
  IconSettings,
  IconTarget
} from "@tabler/icons-react";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Image from "next/image";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/utils/api-fetch";
import CacheDB from "@/utils/cache";
import { clearSessionUser } from "@/utils/session";
import { Option } from "./ui/sidebar-option";

type SelectedSection = "overview" | "issues" | "agents" | "agents-gestor" | "projects" | "settings";

interface Props {
  selected: SelectedSection;
  user?: {
    name: string;
    avatar: string;
    id: string;
    role: "USER" | "DEVELOPER";
  };
  router: AppRouterInstance
}

export default function Sidebar(props: Props) {
  const [visibility, setVisibility] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSidebarClosing, setIsSidebarClosing] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const router = props.router;

  const closeMenu = useCallback(() => {
    if (!menuOpen) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMenuOpen(false);
      setIsMenuClosing(false);
      return;
    }

    setIsMenuClosing(true);
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeMenu]);

  const toggle = () => {
    if (!visibility) {
      setVisibility(true);
      setIsSidebarClosing(false);
      return;
    }

    if (isSidebarClosing) {
      setIsSidebarClosing(false);
      return;
    }

    closeMenu();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibility(false);
      return;
    }

    setIsSidebarClosing(true);
  };

  const goToProfileSettings = () => {
    closeMenu();
    router.push("/profile/settings");
  };

  const logout = async () => {
    setIsSigningOut(true);

    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearSessionUser();
      CacheDB.delete(props.user?.id);
      closeMenu();
      setIsSigningOut(false);
      router.replace("/auth/signin");
      router.refresh();
    }
  };

  const options = [
    {
      label: "Overview",
      icon: <IconLayoutDashboard size={16} strokeWidth={2} />,
      action: () => { router.push("/dashboard") },
      selected: props.selected === "overview"
    },
    {
      label: "Issues",
      icon: <IconTarget size={16} strokeWidth={2} />,
      action: () => { router.push("/issues") },
      selected: props.selected === "issues"
    },
    {
      label: "Agent",
      icon: <IconPointer2 size={16} strokeWidth={2} />,
      action: () => { router.push("/agents") },
      selected: props.selected === "agents"
    },
    {
      label: "Agents gestor",
      icon: <IconBrain size={16} strokeWidth={2} />,
      action: () => { router.push("/agents/gestor") },
      selected: props.selected === "agents-gestor"
    },
    {
      label: "Projects",
      icon: <IconFolders size={16} strokeWidth={2} />,
      action: () => { router.push("/projects") },
      selected: props.selected === "projects"
    },
  ];

  if (!visibility) {
    return (
      <section
        className="sticky top-0 z-10 h-auto w-full border-b border-background-focus px-3 py-3 md:h-dvh md:w-max md:border-b-0 md:px-2 md:py-4">
        <button
          type="button"
          className="rounded-xs p-2 text-foreground-off transition-colors hover:bg-surface-raised hover:text-foreground"
          onClick={toggle}>
          <IconLayoutSidebar size={16} strokeWidth={2} />
        </button>
      </section>
    );
  }

  return (
    <aside
      onAnimationEnd={(event) => {
        if (isSidebarClosing && event.animationName === "slide-out-left") {
          setVisibility(false);
          setIsSidebarClosing(false);
        }
      }}
      className={"sticky top-0 z-10 flex h-auto w-full flex-col items-center justify-start border-b border-background-focus bg-surface p-3 md:h-dvh md:w-81 md:border-b-0 md:p-4 " +
        (isSidebarClosing
          ? "animate-slide-out-left animate-duration-180 animate-ease-out animate-slide-distance-[8px]"
          : "animate-slide-in-left animate-duration-180 animate-ease-out animate-slide-distance-[8px]") +
        " motion-reduce:animate-none"}>
      <div
        className="flex w-full items-start justify-center gap-2">
        <div
          ref={menuRef}
          className="relative w-full">
          <button
            type="button"
            className="flex w-full select-none items-center justify-start gap-2 rounded-xs px-3 py-2 transition-colors hover:bg-surface-raised"
            onClick={() => {
              if (menuOpen) {
                closeMenu();
              } else {
                setMenuOpen(true);
                setIsMenuClosing(false);
              }
            }}
            aria-expanded={menuOpen && !isMenuClosing}
            aria-haspopup="menu">
            {
              props.user ?
                <>
                  <Image
                  src={props.user.avatar}
                  alt={props.user.name}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full"
                  unoptimized
                  />
                  <p
                    className="w-full text-start font-heading text-xs text-foreground">
                    {props.user.name}
                  </p>
                </> :
                <div className="animate-pulse flex w-full gap-2">
                  <span className="w-6 rounded-full aspect-square block bg-background-focus" />
                  <span className="w-full h-5 rounded-full block bg-background-focus" />
                </div>
            }
            <IconChevronDown
              size={16}
              strokeWidth={2} />
          </button>

          {
            menuOpen ? (
              <div
                onAnimationEnd={(event) => {
                  if (isMenuClosing && event.animationName === "slide-out-top") {
                    setMenuOpen(false);
                    setIsMenuClosing(false);
                  }
                }}
                aria-hidden={isMenuClosing}
                className={"absolute left-0 top-full z-20 mt-2 w-full rounded-xs border border-background-focus bg-surface p-1 shadow-lg " +
                  (isMenuClosing
                    ? "animate-slide-out-top animate-duration-150 animate-ease-out"
                    : "animate-slide-in-top animate-duration-150 animate-ease-out") +
                  " animate-slide-distance-[6px] motion-reduce:animate-none " +
                  (isMenuClosing ? "pointer-events-none" : "")}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xs px-3 py-2 text-xs text-foreground-off hover:bg-surface-raised hover:text-foreground"
                  onClick={goToProfileSettings}>
                  <IconSettings size={16} strokeWidth={2} />
                  <span>Profile settings</span>
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xs px-3 py-2 text-xs text-foreground-off hover:bg-surface-raised hover:text-foreground disabled:opacity-50"
                  onClick={() => {
                    void logout();
                  }}
                  disabled={isSigningOut}>
                  <IconLogout2 size={16} strokeWidth={2} />
                  <span>{isSigningOut ? "Signing out..." : "Logout"}</span>
                </button>
              </div>
            ) : null
          }
        </div>

        <button
          type="button"
          className="rounded-xs p-2 text-foreground-off transition-colors hover:bg-surface-raised hover:text-foreground"
          onClick={toggle}>
          <IconLayoutSidebar
            size={16}
            strokeWidth={2} />
        </button>
      </div>

      <div
        className="mt-5 flex w-full flex-row items-center justify-start gap-1 overflow-x-auto md:flex-col md:items-center md:justify-center">
        {
          options.map((option, index) => (
            <Option
              key={option.label}
              label={option.label}
              icon={option.icon}
              selected={option.selected}
              action={option.action} />
          ))
        }
      </div>
    </aside>
  );
}
