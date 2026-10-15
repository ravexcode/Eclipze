"use client";

import { useCallback, useEffect, useState } from "react";

import { AGENT_CREDITS_UPDATED_EVENT } from "@/constants/agent-events";
import { USAGE_LIMIT_TICKS } from "@/constants/usage-limits";
import type { AiCreditUsage } from "@/types/ai";
import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";
import { formatUsageCredits, getMonthlyUsageLimit } from "@/utils/usage-limits";

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

  const limit = usage ? getMonthlyUsageLimit(usage) : null;

  return (
    <section
      aria-labelledby="usage-limits-title"
      className="flex flex-col gap-4 rounded-md border border-background-focus bg-background-card p-4">
      <div className="flex items-center justify-between gap-4">
        <h2
          id="usage-limits-title"
          className="text-xs font-medium">
          Monthly usage
        </h2>
        {limit ? (
          <span className="text-xs text-foreground-off">
            Resets {limit.resetLabel}
          </span>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="text-xs text-alert-red">
          {error}
        </p>
      ) : !limit ? (
        <p
          role="status"
          className="text-xs text-foreground-off">
          Loading usage limits…
        </p>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-medium tracking-[-0.03em] ${limit.tone.label}`}>
              {limit.remainingPercent}%
            </span>
            <span className="text-xs text-foreground-off">
              remaining this month
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div
              role="progressbar"
              aria-label="Monthly usage remaining"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={limit.remainingPercent}
              className="h-2 overflow-hidden rounded-full bg-background-focus">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${limit.tone.bar}`}
                style={{ width: `${limit.remainingPercent}%` }}
              />
            </div>
            <div
              aria-hidden="true"
              className="flex justify-between text-[10px] text-foreground-off">
              {USAGE_LIMIT_TICKS.map(tick => (
                <span key={tick}>{tick}%</span>
              ))}
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-3 border-t border-background-focus pt-3 text-xs">
            <div className="flex flex-col gap-1">
              <dt className="text-foreground-off">Used</dt>
              <dd>{formatUsageCredits(limit.usedCredits)}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-foreground-off">Available</dt>
              <dd>{formatUsageCredits(limit.availableCredits)}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-foreground-off">Total</dt>
              <dd>{formatUsageCredits(limit.totalCredits)}</dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}
