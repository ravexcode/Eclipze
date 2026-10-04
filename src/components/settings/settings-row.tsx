import type { ButtonHTMLAttributes, ReactNode } from "react";

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
  const className = `flex min-h-10 w-full items-center gap-2 rounded-sm px-2.5 text-left ${
    isDanger
      ? "border border-alert-red/70 bg-background text-alert-red hover:bg-alert-red/5"
      : "bg-background-card text-foreground hover:bg-background-focus"
  } ${props.onClick ? "cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent" : ""}`;

  const content = (
    <>
      {props.leading ? (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-background-focus text-foreground">
          {props.leading}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={`truncate text-sm font-medium ${isDanger ? "text-alert-red" : "text-foreground"}`}>
          {props.title}
        </span>
        {props.detail ? (
          <span className="text-xs text-foreground-off">{props.detail}</span>
        ) : null}
      </span>
      {props.action ? (
        <span className="ml-auto flex shrink-0 items-center gap-1 text-xs">
          {props.action}
        </span>
      ) : null}
    </>
  );

  if (!props.onClick) {
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
