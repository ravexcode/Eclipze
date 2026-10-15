import type { ButtonHTMLAttributes, ReactNode } from "react";
import { IconChevronDown } from "@tabler/icons-react";

type SettingsRowProps = {
  title: ReactNode;
  leading?: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "danger";
  expanded?: boolean;
  controls?: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
};

export default function SettingsRow(props: SettingsRowProps) {
  const isDanger = props.tone === "danger";
  const isInteractive = Boolean(props.onClick);

  const toneClassName = isDanger
    ? "border-alert-red/30 bg-alert-red/[0.03] text-alert-red hover:border-alert-red/60 hover:bg-alert-red/[0.06]"
    : "border-background-focus bg-background-card text-foreground hover:border-foreground-off/30 hover:bg-background-focus/60";

  const expandedClassName = props.expanded
    ? isDanger
      ? "border-alert-red/60"
      : "border-foreground-off/30 bg-background-focus/60"
    : "";

  const interactiveClassName = isInteractive
    ? "cursor-pointer focus:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
    : "";

  const className = [
    "flex min-h-13 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-200",
    toneClassName,
    expandedClassName,
    interactiveClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {props.leading ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-background-focus bg-background text-foreground">
          {props.leading}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`truncate text-xs font-medium ${isDanger ? "text-alert-red" : "text-foreground"}`}>
          {props.title}
        </span>
        {props.detail ? (
          <span className="min-w-0 truncate text-xs text-foreground-off">{props.detail}</span>
        ) : null}
      </span>
      {props.action ? (
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs">
          {props.action}
        </span>
      ) : null}
      {isInteractive ? (
        <IconChevronDown
          size={15}
          strokeWidth={1.7}
          aria-hidden="true"
          className={`shrink-0 text-foreground-off transition-transform duration-200 ${props.expanded ? "rotate-180" : ""} ${props.action ? "" : "ml-auto"}`} />
      ) : null}
    </>
  );

  if (!isInteractive) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      className={className}
      onClick={props.onClick}
      aria-expanded={props.expanded}
      aria-controls={props.controls}
    >
      {content}
    </button>
  );
}
