"use client";

import { IconChevronDown, IconLayoutSidebar } from "@tabler/icons-react";
import { useState } from "react";

type SelectedSection = "overview" | "mails" | "issues" | "agents" | "projects";

interface Props {
  selected: SelectedSection;
  user: {
    name: string;
    avatar: string;
    id: string;
  };
}

export default function Sidebar(props: Props) {
  const [visibility, setVisibility] = useState(true);

  const toggle = () => {
    setVisibility(!visibility);
  };

  if (!visibility) {
    return (
      <button
        type="button"
        className="rounded-sm p-2 hover:bg-background-focus"
        onClick={toggle}
      >
        <IconLayoutSidebar size={16} strokeWidth={2} />
      </button>
    );
  }

  return (
    <aside className="h-full min-h-dvh w-80 bg-background-card p-4 flex flex-col justify-start items-center">
      <div className="flex gap-2 justify-center items-center w-full">
        <div className="w-full flex items-center justify-start gap-2 hover:bg-background-focus p-2 select-none rounded-sm px-3">
          <img
            src={props.user.avatar}
            alt={props.user.name}
            className="w-6 h-6 rounded-full"
          />
          <p className="text-foreground text-sm">{props.user.name}</p>
          <IconChevronDown size={16} strokeWidth={2} />
        </div>

        <button
          type="button"
          className="rounded-sm p-2 hover:bg-background-focus"
          onClick={toggle}
        >
          <IconLayoutSidebar size={16} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
