"use client";

import {
  IconBrain,
  IconChevronDown,
  IconFolders,
  IconLayoutDashboard,
  IconLayoutSidebar,
  IconLogout2,
  IconMail,
  IconPointer2,
  IconSettings,
  IconTarget
} from "@tabler/icons-react";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { useEffect, useRef, useState } from "react";

type SelectedSection = "overview" | "mails" | "issues" | "agents" | "agents-gestor" | "projects" | "settings";

interface Props {
  selected: SelectedSection;
  user?: {
    name: string;
    avatar: string;
    id: string;
  };
  router: AppRouterInstance
}

interface OptionsProps {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  selected: boolean;
}

function Option(props: OptionsProps) {
  const classes = props.selected ? "bg-background-focus text-foreground cursor-default" : "text-foreground-off hover:bg-background-focus/70 cursor-pointer";

  return (
    <button
      type="button"
      onClick={props.action}
      className={"text-sm flex gap-1 items-center justify-center p-2 px-3 rounded-sm w-full " + classes}>
      {props.icon}
      <p
        className="w-full text-start">
        {props.label}
      </p>
    </button>
  );
}

export default function Sidebar(props: Props) {
  const [visibility, setVisibility] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSidebarClosing, setIsSidebarClosing] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const router = props.router;

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
  }, [menuOpen]);

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

  const closeMenu = () => {
    if (!menuOpen) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMenuOpen(false);
      setIsMenuClosing(false);
      return;
    }

    setIsMenuClosing(true);
  };

  const goToProfileSettings = () => {
    closeMenu();
    router.push("/dashboard/settings");
  };

  const logout = async () => {
    setIsSigningOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
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
      label: "My mails",
      icon: <IconMail size={16} strokeWidth={2} />,
      action: () => { router.push("/mails") },
      selected: props.selected === "mails"
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
        className="w-max px-2 py-4 h-dvh sticky top-0">
        <button
          type="button"
          className="rounded-sm p-2 hover:bg-background-focus"
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
      className={"h-full min-h-dvh w-80 bg-background-card p-4 flex flex-col justify-start items-center " +
        (isSidebarClosing
          ? "animate-slide-out-left animate-duration-180 animate-ease-out [--tw-anim-slide-distance:8px]"
          : "animate-slide-in-left animate-duration-180 animate-ease-out [--tw-anim-slide-distance:8px]") +
        " motion-reduce:animate-none"}>
      <div
        className="flex gap-2 justify-center items-start w-full">
        <div
          ref={menuRef}
          className="relative w-full">
          <button
            type="button"
            className="w-full flex items-center justify-start gap-2 hover:bg-background-focus p-2 select-none rounded-sm px-3"
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
                  <img
                  src={props.user.avatar}
                  alt={props.user.name}
                  className="w-4 h-4 rounded-full"
                  />
                  <p
                    className="text-foreground text-sm w-full text-start">
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
                className={"absolute top-full left-0 mt-2 w-full rounded-sm border border-background-focus bg-background-card p-1 shadow-lg z-20 " +
                  (isMenuClosing
                    ? "animate-slide-out-top animate-duration-150 animate-ease-out"
                    : "animate-slide-in-top animate-duration-150 animate-ease-out") +
                  " [--tw-anim-slide-distance:6px] motion-reduce:animate-none " +
                  (isMenuClosing ? "pointer-events-none" : "")}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground-off hover:bg-background-focus hover:text-foreground"
                  onClick={goToProfileSettings}>
                  <IconSettings size={16} strokeWidth={2} />
                  <span>Profile settings</span>
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground-off hover:bg-background-focus hover:text-foreground disabled:opacity-50"
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
          className="rounded-sm p-2 hover:bg-background-focus"
          onClick={toggle}>
          <IconLayoutSidebar
            size={16}
            strokeWidth={2} />
        </button>
      </div>

      <div
        className="flex flex-col items-center justify-center w-full mt-5">
        {
          options.map((option, index) => (
            <Option
              key={index}
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
