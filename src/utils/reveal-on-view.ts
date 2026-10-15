"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type RevealPhase = "idle" | "entering" | "exiting";

type RevealOnViewOptions = {
  enterThreshold: number;
  exitThreshold: number;
};

function clampThreshold(threshold: number) {
  return Math.min(Math.max(threshold, 0), 1);
}

// Restarts the CSS animation of an element. Swapping only the animation
// direction does not replay an animation in Chrome or Firefox.
function restartAnimation(element: HTMLElement) {
  element.style.animation = "none";

  void element.offsetWidth;

  element.style.removeProperty("animation");
}

export function useRevealOnView<ElementType extends HTMLElement>({
  enterThreshold,
  exitThreshold,
}: RevealOnViewOptions) {
  const elementRef = useRef<ElementType>(null);
  const [phase, setPhase] = useState<RevealPhase>("idle");

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    const enterRatio = clampThreshold(enterThreshold);
    const exitRatio = clampThreshold(exitThreshold);

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const visibleRatio = entry.isIntersecting ? entry.intersectionRatio : 0;

          if (entry.isIntersecting && visibleRatio >= enterRatio) {
            setPhase("entering");
          } else if (visibleRatio < exitRatio) {
            setPhase(currentPhase => {
              if (currentPhase === "idle") return currentPhase;

              return "exiting";
            });
          }
        }
      },
      {
        threshold: Array.from(new Set([0, enterRatio, exitRatio])),
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enterThreshold, exitThreshold]);

  useLayoutEffect(() => {
    const element = elementRef.current;

    if (!element || phase === "idle") return;

    restartAnimation(element);
  }, [phase]);

  return { elementRef, phase };
}
