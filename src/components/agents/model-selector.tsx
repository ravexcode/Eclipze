"use client";

import type { AiProviderConnection } from "@/types/ai";
import { IconAlertTriangle, IconCheck, IconChevronDown } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import KeyHints from "./key-hints";
import type { ModelOption } from "./types";

export default function ModelSelector({
  model,
  models,
  connections,
  onChange,
}: {
  model: string;
  models: ModelOption[];
  connections: AiProviderConnection[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const selectedModel = models.find((item) => item.id === model) ?? models[0];

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  if (!selectedModel) return null;

  return (
    <div ref={selectorRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-sm bg-background-focus px-3 py-2.5 text-left transition-colors hover:bg-background-focus/80"
        aria-expanded={open}
        aria-haspopup="listbox">
        <span className="min-w-0">
          <span className="block truncate text-sm text-foreground">
            {selectedModel.label}
          </span>
          <span className="mt-0.5 block text-[11px] text-foreground-off">
            {selectedModel.provider}
          </span>
        </span>
        <IconChevronDown
          className={"shrink-0 text-foreground-off transition-transform duration-180 " + (open ? "rotate-180" : "")}
          size={16}
          strokeWidth={1.8}
        />
      </button>

      {open && (
        <div
          className="absolute bottom-full z-30 mb-2 w-full origin-bottom animate-slide-in-bottom rounded-sm border border-background-focus bg-background-card p-1 shadow-lg animate-duration-180 animate-ease-out motion-reduce:animate-none"
          role="listbox"
          aria-label="Available models">
          <div className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-foreground-off">
            Choose a model
          </div>
          <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
            {models.map((option) => {
              const configured = Boolean(
                option.keyHint ||
                  connections.some((connection) => connection.provider === option.providerId),
              );

              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={option.id === model}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left hover:bg-background-focus">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">
                      {option.label}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-foreground-off">
                      <span>{option.provider}</span>
                      {configured ? (
                        <span className="text-green-400">API key ready</span>
                      ) : (
                        <span className="flex items-center gap-1 text-warning">
                          <IconAlertTriangle size={12} strokeWidth={1.8} />
                          Key required
                        </span>
                      )}
                    </span>
                  </span>
                  {option.id === model && (
                    <IconCheck
                      className="shrink-0 text-foreground"
                      size={16}
                      strokeWidth={1.8}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-1 border-t border-background-focus px-3 py-2">
            <KeyHints connections={connections} compact />
          </div>
        </div>
      )}
    </div>
  );
}
