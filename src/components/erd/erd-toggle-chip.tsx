interface Props {
  label: string;
  isActive: boolean;
  disabled?: boolean;
  onToggle(): void;
}

export default function ErdToggleChip(props: Props) {
  return (
    <button
      type="button"
      aria-pressed={props.isActive}
      disabled={props.disabled}
      onClick={props.onToggle}
      className={`rounded-sm border px-2 py-0.5 text-[11px] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${props.isActive
        ? "border-accent bg-accent/20 text-foreground"
        : "border-background-focus text-foreground-off hover:bg-background-focus hover:text-foreground"
        }`}>
      {props.label}
    </button>
  );
}
