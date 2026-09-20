interface OptionsProps {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  selected: boolean;
}

export function Option(props: OptionsProps) {
  const classes = props.selected ? "bg-surface-raised text-foreground cursor-default" : "text-foreground-off hover:bg-surface-raised/70 cursor-pointer";

  return (
    <button
      type="button"
      onClick={props.action}
      className={"flex w-auto shrink-0 items-center justify-center gap-2 rounded-xs px-3 py-2 text-xs transition-colors md:w-full md:text-left " + classes}>
      {props.icon}
      <p
        className="w-full text-start">
        {props.label}
      </p>
    </button>
  );
}
