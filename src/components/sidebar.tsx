"use client";

import {
  IconChevronDown,
  IconFolders,
  IconInbox,
  IconLayoutDashboard,
  IconLayoutSidebar,
  IconMessage,
  IconLogout2,
  IconPointer2,
  IconSearch,
  IconSettings,
  IconTarget
} from "@tabler/icons-react";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Image from "next/image";
import Link from "next/link";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/utils/api-fetch";
import CacheDB from "@/utils/cache";
import { clearSessionUser } from "@/utils/session";
import { Option } from "./ui/sidebar-option";
import type { AgentRun } from "@/types/agent-runner";
import { readJson } from "@/utils/json-payload";

type SelectedSection = "overview" | "inbox" | "issues" | "agents" | "projects" | "settings";

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
  const [navigationQuery, setNavigationQuery] = useState("");
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const router = props.router;

  const loadAgentRuns = useCallback(async () => {
    try {
      const response = await apiFetch("/api/agent-runs", { cache: "no-store" });
      const payload = await readJson(response) as { runs?: AgentRun[] };
      if (response.ok) setAgentRuns(payload.runs ?? []);
    } catch {
      setAgentRuns([]);
    }
  }, []);

  useEffect(() => {
    if (props.selected !== "agents") return;
    const initialLoadTimer = window.setTimeout(() => { void loadAgentRuns(); }, 0);
    const handleRunsUpdated = () => { void loadAgentRuns(); };
    window.addEventListener("agent-runs-updated", handleRunsUpdated);
    return () => {
      window.clearTimeout(initialLoadTimer);
      window.removeEventListener("agent-runs-updated", handleRunsUpdated);
    };
  }, [loadAgentRuns, props.selected]);

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
      icon: <IconLayoutDashboard size={20} strokeWidth={2} />,
      action: () => { router.push("/dashboard") },
      selected: props.selected === "overview"
    },
    {
      label: "Inbox",
      icon: <IconInbox size={20} strokeWidth={2} />,
      action: () => { router.push("/inbox") },
      selected: props.selected === "inbox"
    },
    {
      label: "Issues",
      icon: <IconTarget size={20} strokeWidth={2} />,
      action: () => { router.push("/issues") },
      selected: props.selected === "issues"
    },
    {
      label: "Projects",
      icon: <IconFolders size={20} strokeWidth={2} />,
      action: () => { router.push("/projects") },
      selected: props.selected === "projects"
    },
    {
      label: "Agents",
      icon: <IconPointer2 size={20} strokeWidth={2} />,
      action: () => { router.push("/agents") },
      selected: props.selected === "agents"
    },
  ];

  const visibleOptions = options.filter(option =>
    option.label.toLowerCase().includes(navigationQuery.trim().toLowerCase()),
  );

  if (!visibility) {
    return (
      <section
        className="sticky top-0 z-10 h-auto w-full border-b border-background-focus px-3 py-3 md:h-dvh md:w-max md:border-b-0 md:px-2.5 md:py-5">
        <button
          type="button"
          className="rounded-xs p-2.5 text-foreground-off transition-colors hover:bg-surface-raised hover:text-foreground"
          onClick={toggle}>
          <IconLayoutSidebar size={20} strokeWidth={2} />
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
      className={"sticky top-0 z-10 flex h-auto w-full flex-col items-center justify-start border-b border-background-focus bg-surface p-3 md:h-dvh md:w-62 md:border-b-0 md:p-4 " +
        (isSidebarClosing
          ? "animate-slide-out-left animate-duration-140 animate-linear animate-slide-distance-[6px]"
          : "animate-slide-in-left animate-duration-140 animate-linear animate-slide-distance-[6px]") +
        " motion-reduce:animate-none"}>
      <div className="flex w-full flex-col md:h-full">
        <div className="flex w-full items-center justify-between px-2.5">
          <Link href="/dashboard" aria-label="Eclipze dashboard" className="rounded-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
            <Image
              src="/logo.svg"
              alt="Logo image"
              width={23}
              height={23}
              loading="eager"
            />
          </Link>
          <button
            type="button"
            className="rounded-xs p-2.5 text-foreground-off transition-colors hover:bg-surface-raised hover:text-foreground"
            onClick={toggle}
            aria-label="Collapse sidebar">
            <IconLayoutSidebar size={20} strokeWidth={2} />
          </button>
        </div>

        <label className="mt-5 flex h-10 w-full items-center gap-2.5 rounded-full bg-background-focus px-3 text-foreground-off focus-within:ring-1 focus-within:ring-accent">
          <IconSearch size={18} strokeWidth={1.8} aria-hidden="true" />
          <span className="sr-only">Search navigation</span>
          <input
            type="search"
            value={navigationQuery}
            onChange={event => setNavigationQuery(event.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-hidden placeholder:text-foreground-off"
          />
        </label>

        <nav aria-label="Main navigation" className="mt-6 flex w-full flex-row items-center justify-start gap-1.5 overflow-x-auto md:flex-col md:items-stretch">
          {visibleOptions.map(option => (
            <Option
              key={option.label}
              label={option.label}
              icon={option.icon}
              selected={option.selected}
              action={option.action}
            />
          ))}
        </nav>

        {props.selected === "agents" ? (
          <section className="mt-5 flex min-h-0 w-full flex-col gap-2 md:flex-1" aria-label="Agent sessions">
            <div className="flex items-center justify-between px-2.5">
              <h2 className="text-[11px] font-medium text-foreground-off">Sessions</h2>
              <button type="button" onClick={() => router.push("/agents")} className="text-[10px] text-foreground-off hover:text-foreground">New chat</button>
            </div>
            <nav className="flex max-h-56 flex-col gap-0.5 overflow-y-auto md:max-h-none" aria-label="Agent sessions">
              {agentRuns.map(run => (
                <button key={run.id} type="button" onClick={() => router.push(`/agents/${run.id}`)} className="flex w-full items-start gap-2 rounded-xs px-2.5 py-2 text-left text-xs text-foreground-off transition-colors hover:bg-surface-raised hover:text-foreground">
                  <IconMessage size={14} className="mt-0.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{run.prompt?.split("\n")[0] || "New session"}</span>
                </button>
              ))}
              {agentRuns.length === 0 ? <p className="px-2.5 py-2 text-[10px] text-foreground-off">Your sessions will appear here.</p> : null}
            </nav>
          </section>
        ) : null}

        <div ref={menuRef} className="relative mt-5 w-full md:mt-auto">
          <button
            type="button"
            className="flex w-full select-none items-center justify-start gap-2.5 rounded-xs px-2.5 py-2.5 transition-colors hover:bg-surface-raised"
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
            {props.user ? (
              <>
                <Image
                  src={props.user.avatar}
                  alt={props.user.name}
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-full"
                  unoptimized
                />
                <span className="min-w-0 flex-1 truncate text-start text-[15px] text-foreground">
                  {props.user.name}
                </span>
              </>
            ) : (
              <div className="flex w-full animate-pulse gap-2">
                <span className="block aspect-square w-5 rounded-full bg-background-focus" />
                <span className="block h-5 w-full rounded-full bg-background-focus" />
              </div>
            )}
            <IconChevronDown size={18} strokeWidth={2} />
          </button>

          {menuOpen ? (
            <div
              onAnimationEnd={event => {
                if (isMenuClosing && event.animationName === "slide-out-top") {
                  setMenuOpen(false);
                  setIsMenuClosing(false);
                }
              }}
              aria-hidden={isMenuClosing}
              className={"absolute bottom-full left-0 z-20 mb-2.5 w-full rounded-xs border border-background-focus bg-surface p-1.5 md:top-auto " +
                (isMenuClosing
                  ? "animate-slide-out-top animate-duration-150 animate-ease-out"
                  : "animate-slide-in-top animate-duration-150 animate-ease-out") +
                " animate-slide-distance-[6px] motion-reduce:animate-none " +
                (isMenuClosing ? "pointer-events-none" : "")}>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-xs px-3 py-2.5 text-[15px] text-foreground-off hover:bg-surface-raised hover:text-foreground"
                onClick={goToProfileSettings}>
                <IconSettings size={20} strokeWidth={2} />
                <span>Profile settings</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-xs px-3 py-2.5 text-[15px] text-foreground-off hover:bg-surface-raised hover:text-foreground disabled:opacity-50"
                onClick={() => void logout()}
                disabled={isSigningOut}>
                <IconLogout2 size={20} strokeWidth={2} />
                <span>{isSigningOut ? "Signing out..." : "Logout"}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
