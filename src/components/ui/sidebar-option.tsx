interface OptionsProps {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  selected: boolean;
}

export function Option(props: OptionsProps) {
  const classes = props.selected ? "bg-background-focus text-foreground cursor-default" : "text-foreground-off hover:bg-background-focus/70 cursor-pointer";

  return (
    <button
      type="button"
      onClick={props.action}
      className={"text-sm flex gap-1 items-center justify-center p-2 px-3 rounded-sm w-full " + classes}>
      {props.icon}
      <p
        className="w-full text-start">
        {props.label}
      </p>
    </button>
  );
}
