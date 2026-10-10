// Set up
"use client";

interface Props {
  selected: SelectedSection;
  user?: {
    name: string;
    avatar: string;
    id: string;
    role: "USER" | "DEVELOPER";
  };
  router: AppRouterInstance
};

import Image from "next/image";

// React imports
import { useEffect, useRef } from "react";

// Icons
import {
  IconLayoutSidebar,
  IconSearch
} from "@tabler/icons-react";

// Components

import {
  labels,
  type SelectedSection
} from "@/constants/components/sidebar-labels";

// Types
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Link from "next/link";

// Main content
export default function Sidebar(props: Props) {

  // Components
  const search_field = useRef<HTMLInputElement>(null);

  // Constants
  const labels_data = labels(props.selected);

  //Functions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";

      if (!isSearchShortcut) return;

      event.preventDefault();
      search_field.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <aside
      className="h-full flex flex-col items-center justify-start pb-2 pt-7 gap-7 relative w-80 bg-background-card px-3">
      <div
        className="w-full flex items-center justify-between px-4">
        <Image
          src="/logo.svg"
          alt="Eclipze logo"
          width={50}
          height={50}
          className="aspect-square block w-5" />

        <button
          type="button"
          className="cursor-pointer">
          <IconLayoutSidebar
            size={18}
            stroke={1.5} />
        </button>
      </div>

      <section
        className="w-full rounded-full bg-background-focus flex justify-center items-center text-xs px-5 gap-2">
        <input
          ref={search_field}
          type="text"
          className="w-full h-full py-2 text-start placeholder:text-foreground-off text-foreground outline-none"
          placeholder="Search" />

        <p
          className="text-foreground-off">
          ⌘K
        </p>
        <IconSearch
          size={15} />
      </section>

      <section
        className="w-full flex flex-col gap-1 text-xs">
        {
          labels_data.map((label, index) =>
            <Link
              key={index}
              href={label.redirection}
              className={"w-full flex gap-2 items-center justify-start px-3 py-2 rounded-sm " + (label.selected ? "bg-background-focus" : "hover:bg-background-focus/50 text-foreground-off")}>
              {label.icon}

              {label.label}
            </Link>
          )
        }
      </section>

      {props.user ? (
        <button
          className="mt-auto flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-background-focus/50 text-sm cursor-pointer"
          aria-label={`Open settings for ${props.user.name}`}
        >
          <Image
            src={props.user.avatar || "/logo.svg"}
            alt=""
            width={20}
            height={20}
            className="w-5 block aspect-square shrink-0 rounded-full bg-background-focus object-cover"
            unoptimized
          />
          <span className="min-w-0 text-left">
            <span className="block truncate text-sm font-medium text-foreground">
              {props.user.name}
            </span>
          </span>
        </button>
      ) : null}

    </aside>
  );
}
