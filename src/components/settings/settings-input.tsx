import type { InputHTMLAttributes } from "react";

const INPUT_CLASS_NAME =
  "w-full rounded-sm border border-transparent bg-background-focus px-3 py-2 text-sm outline-none duration-300 focus:border-accent disabled:pointer-events-none disabled:opacity-50";

export default function SettingsInput(
  props: InputHTMLAttributes<HTMLInputElement>,
) {
  const { className = "", ...inputProps } = props;

  return (
    <input
      {...inputProps}
      className={[INPUT_CLASS_NAME, className].filter(Boolean).join(" ")}
    />
  );
}
