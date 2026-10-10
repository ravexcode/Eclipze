import {
  IconFolders,
  IconInbox,
  IconLayoutDashboard,
  IconPointer2,
  IconTarget
} from "@tabler/icons-react";

export type SelectedSection = "overview" | "inbox" | "issues" | "agents" | "projects" | "settings";

const icon_size = 18; const icon_width = 2;

export const labels = (selected: SelectedSection) => {
  const data = [
    {
      label: "Overview",
      icon: <IconLayoutDashboard size={icon_size} strokeWidth={icon_width} />,
      redirection: "/dashboard",
      selected: selected === "overview"
    },
    {
      label: "Inbox",
      icon: <IconInbox size={icon_size} strokeWidth={icon_width} />,
      redirection: "/inbox",
      selected: selected === "inbox"
    },
    {
      label: "Issues",
      icon: <IconTarget size={icon_size} strokeWidth={icon_width} />,
      redirection: "/issues",
      selected: selected === "issues"
    },
    {
      label: "Projects",
      icon: <IconFolders size={icon_size} strokeWidth={icon_width} />,
      redirection: "/projects",
      selected: selected === "projects"
    },
    {
      label: "Agents",
      icon: <IconPointer2 size={icon_size} strokeWidth={icon_width} />,
      redirection: "/agents",
      selected: selected === "agents"
    },
  ];

  return data;
}
