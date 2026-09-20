import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Panel(props: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-sm bg-surface ${props.className ?? ""}`}>
      {props.children}
    </section>
  );
}

export function PanelHeading(props: { icon: ReactNode; label: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-background-focus px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-foreground-off">{props.icon}</span>
        <h2 className="truncate text-sm font-semibold text-foreground">{props.label}</h2>
      </div>
      {props.action}
    </div>
  );
}

export function StatusIndicator(props: { status: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-foreground-off">
      <span className={`h-2 w-2 rounded-full ${statusColor(props.status)}`} />
      {statusLabel(props.status)}
    </span>
  );
}

export function SmallButton(props: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "default" | "accent" | "danger" }) {
  const tone = props.tone ?? "default";
  const toneClass = tone === "accent"
    ? "bg-accent text-foreground hover:bg-accent-strong"
    : tone === "danger"
      ? "text-alert-red hover:bg-alert-red/10"
      : "text-foreground-off hover:bg-background-focus hover:text-foreground";

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xs px-3 py-2 text-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 ${toneClass} ${props.className ?? ""}`} />
  );
}

export function FieldLabel(props: { children: ReactNode }) {
  return <span className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-foreground-off">{props.children}</span>;
}

export const fieldClassName = "w-full rounded-xs border border-background-focus bg-background px-3 py-2.5 text-sm text-foreground outline-hidden transition-colors placeholder:text-foreground-off/60 focus:border-accent focus:ring-1 focus:ring-accent";

function statusColor(status: string) {
  if (status === "COMPLETED" || status === "SUCCEEDED" || status === "ACTIVE") return "bg-status-green";
  if (status === "FAILED" || status === "AT_RISK") return "bg-alert-red";
  if (status === "CANCELLED") return "bg-warning";
  return "bg-foreground-off";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}
