import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type ButtonVariant = "main" | "secondary" | "ghost";

interface ButtonElementProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: never;
}

interface ButtonLinkProps
  extends Omit<ComponentProps<typeof Link>, "className" | "type"> {
  variant?: ButtonVariant;
  className?: string;
}

type ButtonProps = ButtonElementProps | ButtonLinkProps;

function isButtonLinkProps(props: ButtonProps): props is ButtonLinkProps {
  return props.href !== undefined;
}

const baseStyles =
  "inline-flex min-h-9 items-center justify-center rounded-xs px-4 py-2 text-xs font-medium tracking-[0.01em] duration-200 outline-hidden transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const variantStyles: Record<ButtonVariant, string> = {
  main: "bg-accent text-foreground hover:bg-accent-strong",
  secondary:
    "border border-background-focus bg-background-card text-foreground hover:bg-background-focus",
  ghost:
    "text-foreground-off hover:bg-background-focus hover:text-foreground",
};

export default function Button(props: ButtonProps) {
  const { variant = "main", className = "" } = props;
  const classes = [baseStyles, variantStyles[variant], className]
    .filter(Boolean)
    .join(" ");

  if (isButtonLinkProps(props)) {
    const linkProps = { ...props };
    delete linkProps.variant;
    delete linkProps.className;

    return <Link className={classes} {...linkProps} />;
  }

  const buttonProps = { ...props };
  delete buttonProps.variant;
  delete buttonProps.className;
  const { type = "button", ...buttonAttributes } = buttonProps;

  return (
    <button
      type={type}
      className={classes}
      {...buttonAttributes}
    />
  );
}
