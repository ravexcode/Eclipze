"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

export type MenuSelectorOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  description?: string;
};

interface Props<TValue extends string> {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  onChange: (value: TValue) => void;
  options: readonly MenuSelectorOption<TValue>[];
  placeholder: string;
  value: TValue;
}

export default function MenuSelector<TValue extends string>({
  ariaLabel,
  className = "w-full",
  disabled = false,
  onChange,
  options,
  placeholder,
  value,
}: Props<TValue>) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const focusOnOpen = useRef<"first" | "last" | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!expanded) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setExpanded(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [expanded]);

  useEffect(() => {
    if (!expanded || !focusOnOpen.current) return;

    const options = listRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="option"]',
    );
    const target = focusOnOpen.current === "last"
      ? Math.max((options?.length ?? 1) - 1, 0)
      : 0;
    options?.[target]?.focus();
    focusOnOpen.current = null;
  }, [expanded]);

  const focusOption = (current: HTMLButtonElement, direction: -1 | 1) => {
    const options = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
    );
    const currentIndex = options.indexOf(current);
    const nextIndex = (currentIndex + direction + options.length) % options.length;
    options[nextIndex]?.focus();
  };

  return (
    <div ref={containerRef} className={`relative min-w-0 text-xs ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${ariaLabel}: ${selectedOption?.label ?? placeholder}`}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        disabled={disabled}
        onClick={() => {
          setExpanded((previous) => {
            const nextExpanded = !previous;
            if (nextExpanded) focusOnOpen.current = "first";
            return nextExpanded;
          });
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          focusOnOpen.current = event.key === "ArrowUp" ? "last" : "first";
          setExpanded(true);
        }}
        className="flex min-h-9 w-full items-center justify-between gap-3 rounded-sm bg-background-card hover:bg-background-focus px-2.5 py-2 text-left text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50">
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.label ?? placeholder}
        </span>
        <IconChevronDown
          size={14}
          strokeWidth={1.8}
          className={`shrink-0 text-foreground/80 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded ? (
        <div
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-full z-30 mt-1 max-h-64 w-full min-w-48 overflow-y-auto rounded-sm border border-background-focus bg-background-card p-1">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                title={option.label}
                onClick={() => {
                  onChange(option.value);
                  setExpanded(false);
                  triggerRef.current?.focus();
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    focusOption(event.currentTarget, event.key === "ArrowDown" ? 1 : -1);
                  }
                  if (event.key === "Home" || event.key === "End") {
                    event.preventDefault();
                    const availableOptions = listRef.current?.querySelectorAll<HTMLButtonElement>(
                      '[role="option"]',
                    );
                    const index = event.key === "Home" ? 0 : (availableOptions?.length ?? 1) - 1;
                    availableOptions?.[index]?.focus();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setExpanded(false);
                    triggerRef.current?.focus();
                  }
                }}
                className={`flex w-full flex-col gap-1 rounded-xs px-3 py-2 text-left transition-colors hover:bg-background-focus focus-visible:outline-2 focus-visible:outline-accent ${selected ? "bg-background-focus" : ""
                  }`}>
                <span className="truncate font-medium text-foreground">
                  {option.label}
                </span>
                {option.description ? (
                  <span className="text-[10px] leading-4 text-foreground/80">
                    {option.description}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
