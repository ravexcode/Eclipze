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

// Components imports
import UserProfile from "./ui/profile";

// Types
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { User } from "@/types/user";

// Main content
export default function Sidebar(props: Props) {
  // Sidebar definitions
  const [width, setWidth] = useState<number>(300);
  const [bgColor, setBgColor] = useState<string>("#060606");
  const [expanded, setExpanded] = useState(true);

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

  const toggle = () => {
    setExpanded(prev => !prev);
    setWidth(prev => prev === 300 ? 40 : 300);
    setBgColor(prev => prev === "#060606" ? "#00000000" : "#060606");
  }

  return (
    <aside
      className="h-full flex flex-col items-center justify-start pb-2 pt-7 gap-7 relative px-3 duration-200"
      style={{
        width: `${width}px`,
        backgroundColor: bgColor,
      }}>
      {
        expanded ?
          <>
            <div
              className="w-full flex items-center justify-between">
              <Image
                src="/logo.svg"
                alt="Eclipze logo"
                width={50}
                height={50}
                className="aspect-square block w-5"
                loading="eager" />

              <button
                type="button"
                className="cursor-pointer text-foreground-off hover:text-foreground duration-200"
                onClick={toggle}>
                <IconLayoutSidebar
                  size={18}
                  stroke={1.5} />
              </button>
            </div>

            <section
              className="w-full rounded-md bg-background-card flex justify-center items-center text-xs px-5 gap-2 border border-background-focus">
              <input
                ref={search_field}
                type="text"
                value={search_query}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search navigation"
                className="min-w-0 flex-1 h-full py-2 text-start placeholder:text-foreground-off text-foreground outline-hidden"
                placeholder="Search" />

              <p
                className="shrink-0 text-foreground-off">
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
                    className={"w-full flex gap-2 items-center justify-start px-3 py-1.5 rounded-md " + (label.selected ? "bg-background-focus" : "hover:bg-background-focus/50 text-foreground-off")}>
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
          </> :
          <button
            type="button"
            className="cursor-pointer text-foreground-off hover:text-foreground duration-200"
            onClick={toggle}>
            <IconLayoutSidebar
              size={18}
              stroke={1.5} />
          </button>
      }

    </aside>
  );
}
