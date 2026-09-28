"use client";

import { IconChevronDown, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";

import type { AvailableModel } from "@/utils/agents";
import Image from "next/image";

interface Props {
  current: string;
  setCurrent: React.Dispatch<React.SetStateAction<string>>;
  values: AvailableModel[];
  disabled?: boolean;
}

export default function SelectorInput(props: Props) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const filteredValues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return props.values;

    return props.values.filter(model =>
      `${model.name} ${model.id}`.toLowerCase().includes(normalizedQuery),
    );
  }, [props.values, query]);
  const selectedModel = props.values.find(model => model.id === props.current);

  return (
    <div className="relative w-full max-w-xl">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={expanded}
        disabled={props.disabled || props.values.length === 0}
        onClick={() => {
          setExpanded(previous => !previous);
          setQuery("");
        }}
        className={`flex w-70 items-center justify-between gap-3 rounded-sm bg-background-card px-3 py-2 text-left text-sm transition-colors hover:bg-background-focus disabled:brightness-[0.8] disabled:cursor-not-allowed ${props.disabled || props.values.length === 0 ? "brightness-[0.8] cursor-not-allowed" : "cursor-pointer"}`}>
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          {selectedModel ? (
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{selectedModel.name}</span>
            </span>
          ) : (
            <span className="truncate">{props.current || "Select a model"}</span>
          )}
        </span>
        <IconChevronDown size={16} className="shrink-0 text-foreground-off" />
      </button>

      {expanded && !props.disabled ? (
        <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-sm border border-background-focus bg-background-card">
          <label className="flex items-center gap-2 border-b border-background-focus px-3 py-2 text-foreground-off">
            <IconSearch size={16} />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search models"
              aria-label="Search models"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-hidden placeholder:text-foreground-off/70" />
          </label>

          <div className="max-h-60 overflow-y-auto p-1" role="listbox" aria-label="Available models">
            {filteredValues.length > 0 ? filteredValues.map(model => (
              <button
                type="button"
                role="option"
                aria-selected={model.id === props.current}
                key={`${model.provider}:${model.id}`}
                onClick={() => {
                  props.setCurrent(model.id);
                  setExpanded(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xs px-3 py-2 text-left hover:bg-background-focus ${model.id === props.current ? "bg-background-focus" : ""}`}>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{model.name}</span>
                  {model.id !== model.name ? (
                    <span className="truncate text-xs text-foreground-off">{model.id}</span>
                  ) : null}
                </span>
                {model.provider === "OPENROUTER" ? <OpenRouterLogo /> : null}
              </button>
            )) : (
              <p className="px-3 py-2 text-xs text-foreground-off">No matching models.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OpenRouterLogo() {
  return (
    <Image
      src="/openrouter-favicon.ico"
      alt="OpenRouter"
      title="OpenRouter"
      width={50}
      height={50}
      className="h-5 w-5 shrink-0 rounded-xs" />
  );
}
