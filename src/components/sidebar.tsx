// Set up
"use client";

interface Props {
  selected: SelectedSection;
  user?: User
  router: AppRouterInstance
};

// Next imports
import Image from "next/image";
import Link from "next/link";

// React imports
import { useEffect, useMemo, useRef, useState } from "react";

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

import UserProfile from "./ui/profile";

// Types
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { User } from "@/types/user";

// Main content
export default function Sidebar(props: Props) {

  // Components
  const search_field = useRef<HTMLInputElement>(null);
  const [search_query, setSearchQuery] = useState("");

  // Constants
  const labels_data = labels(props.selected);
  const filtered_labels = useMemo(() => {
    const normalized_query = search_query.trim().toLowerCase();

    if (!normalized_query) return labels_data;

    return labels_data.filter((label) =>
      label.label.toLowerCase().includes(normalized_query)
    );
  }, [labels_data, search_query]);

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
          value={search_query}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Search navigation"
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
          filtered_labels.map((label) =>
            <Link
              key={label.redirection}
              href={label.redirection}
              className={"w-full flex gap-2 items-center justify-start px-3 py-2 rounded-sm " + (label.selected ? "bg-background-focus" : "hover:bg-background-focus/50 text-foreground-off")}>
              {label.icon}

              {label.label}
            </Link>
          )
        }
        {filtered_labels.length === 0 ? (
          <p className="px-3 py-2 text-foreground-off" role="status">
            No navigation options found.
          </p>
        ) : null}
      </section>

      {props.user ? (
        <UserProfile profile={props.user} />
      ) : null}

    </aside>
  );
}
