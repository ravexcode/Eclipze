"use client";

import type { HTMLAttributes, ReactNode } from "react";

import {
  DEFAULT_REVEAL_ANIMATION,
  DEFAULT_REVEAL_ENTER_THRESHOLD,
  DEFAULT_REVEAL_EXIT_THRESHOLD,
  REVEAL_HIDDEN_CLASS,
  REVEAL_REVERSE_DIRECTION_CLASS,
} from "@/constants/reveal-on-view";

import { useRevealOnView } from "@/utils/reveal-on-view";

type RevealOnViewProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  // Tailwind animation class played when the element enters the viewport.
  animation?: string;
  // Tailwind animation class played when the element leaves the viewport.
  // Defaults to `animation` played in reverse.
  exitAnimation?: string;
  // Visible fraction (0 to 1) required to play the enter animation.
  enterThreshold?: number;
  // Visible fraction (0 to 1) below which the exit animation plays.
  exitThreshold?: number;
};

export default function RevealOnView({
  children,
  className,
  animation = DEFAULT_REVEAL_ANIMATION,
  exitAnimation,
  enterThreshold = DEFAULT_REVEAL_ENTER_THRESHOLD,
  exitThreshold = DEFAULT_REVEAL_EXIT_THRESHOLD,
  ...props
}: RevealOnViewProps) {
  const { elementRef, phase } = useRevealOnView<HTMLDivElement>({
    enterThreshold,
    exitThreshold,
  });

  const phaseClassNames = {
    idle: REVEAL_HIDDEN_CLASS,
    entering: animation,
    exiting: exitAnimation ?? `${animation} ${REVEAL_REVERSE_DIRECTION_CLASS}`,
  };

  return (
    <div
      {...props}
      ref={elementRef}
      className={[className, phaseClassNames[phase]].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
