import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "main" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const baseStyles =
  "inline-flex items-center justify-center rounded-sm px-4 py-1.5 text-sm duration-300 outline-none disabled:pointer-events-none disabled:opacity-50";

const variantStyles: Record<ButtonVariant, string> = {
  main: "bg-accent text-foreground hover:brightness-75",
  secondary:
    "border border-background-focus bg-background-card text-foreground hover:bg-background-focus",
  ghost:
    "text-foreground-off hover:bg-background-focus hover:text-foreground",
};

export default function Button({
  variant = "main",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[baseStyles, variantStyles[variant], className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
