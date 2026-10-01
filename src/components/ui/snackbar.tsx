import { IconAlertTriangle, IconX } from "@tabler/icons-react";

interface Props {
  mode: "warn";
  message: string;
  onClose(): void;
}

export default function Snackbar(props: Props) {
  return (
    <div
      role="status"
      className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-sm border border-background-focus bg-background-card p-4 text-sm text-foreground">
      <IconAlertTriangle size={18} className={props.mode === "warn" ? "mt-0.5 shrink-0 text-warning" : "mt-0.5 shrink-0"} />
      <p className="flex-1">{props.message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={props.onClose}
        className="-mr-1 -mt-1 rounded-xs p-1 text-foreground-off hover:bg-background-focus hover:text-foreground">
        <IconX size={16} />
      </button>
    </div>
  );
}
