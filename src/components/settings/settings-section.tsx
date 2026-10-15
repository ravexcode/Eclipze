import type { ReactNode } from "react";

export default function SettingsSection(props: {
  title: string;
  description?: ReactNode;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  const isDanger = props.tone === "danger";

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <h2 className={`text-base font-medium ${isDanger ? "text-alert-red" : "text-foreground"}`}>
          {props.title}
        </h2>
        {props.description ? (
          <p className="text-xs text-foreground-off">{props.description}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-2">
        {props.children}
      </div>
    </section>
  );
}
