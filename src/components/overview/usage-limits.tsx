"use client";

import { useCallback, useEffect, useState } from "react";

import { AGENT_CREDITS_UPDATED_EVENT } from "@/constants/agent-events";
import type { AiCreditUsage, AiCreditUsageWindow } from "@/types/ai";
import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";
import { formatUsageReset, getUsageBarClass, getUsageWindowAvailablePercent } from "@/utils/usage-limits";

export default function UsageLimits() {
  const [usage, setUsage] = useState<AiCreditUsage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await apiFetch("/api/ai-credits", { cache: "no-store" });
      const payload = await readJson(response) as AiCreditUsage & { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load your usage limits.");
      }

      setUsage(payload);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your usage limits.",
      );
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    const reload = () => { void load(); };

    window.addEventListener(AGENT_CREDITS_UPDATED_EVENT, reload);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(AGENT_CREDITS_UPDATED_EVENT, reload);
    };
  }, [load]);

  return (
    <section
      aria-labelledby="usage-limits-title"
      className="flex flex-col gap-4 rounded-md border border-background-focus bg-background-card p-4">
      <h2
        id="usage-limits-title"
        className="text-xs font-medium">
        Usage limits
      </h2>

      {error ? (
        <p
          role="alert"
          className="text-xs text-alert-red">
          {error}
        </p>
      ) : !usage ? (
        <p
          role="status"
          className="text-xs text-foreground-off">
          Loading usage limits…
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {usage.usageWindows.map(window => (
            <UsageWindowRow
              key={window.key}
              window={window} />
          ))}
        </div>
      )}
    </section>
  );
}

function UsageWindowRow({ window }: { window: AiCreditUsageWindow }) {
  const percent = getUsageWindowAvailablePercent(window);
  const resetLabel = formatUsageReset(window.resetAt);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-4 text-xs">
        <span className="font-medium text-foreground">{window.label}</span>
        <span className="text-foreground-off">
          {percent}% available
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={`${window.label} credits available`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 overflow-hidden rounded-full bg-background-focus">
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-500 ${getUsageBarClass(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {resetLabel ? (
        <span className="text-[10px] text-foreground-off">
          {resetLabel}
        </span>
      ) : null}
    </div>
  );
}
