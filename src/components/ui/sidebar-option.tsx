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
      className={"flex w-auto shrink-0 items-center justify-start gap-3 rounded-xs px-4 py-3 text-[18px] transition-colors md:w-full md:justify-start md:text-left " + classes}>
      {props.icon}
      <p
        className="w-full text-start">
        {props.label}
      </p>
    </button>
  );
}
