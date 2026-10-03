"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";

type CreditEntry = {
  id: string;
  type: "INITIAL_GRANT" | "MONTHLY_GRANT" | "RESERVATION" | "SPEND" | "RELEASE";
  deltaCredits: number;
  amountUsd: string | null;
  createdAt: string;
};

type CreditBalance = {
  balance: number;
  reservedCredits: number;
  availableCredits: number;
  monthlyAllowance: number;
  serviceOpenRouterAvailable: boolean;
  entries: CreditEntry[];
};

const entryLabels: Record<CreditEntry["type"], string> = {
  INITIAL_GRANT: "Welcome credits",
  MONTHLY_GRANT: "Monthly credits",
  RESERVATION: "Task reservation",
  SPEND: "AI usage",
  RELEASE: "Reservation released",
};

export default function AiCreditsSection() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void apiFetch("/api/ai-credits", { cache: "no-store" })
      .then(async response => {
        const payload = await readJson(response) as CreditBalance & { message?: string };
        if (cancelled) return;
        if (!response.ok) throw new Error(payload.message ?? "Unable to load AI credits.");
        setBalance(payload);
      })
      .catch(loadError => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load AI credits.");
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <section className="flex w-full flex-col gap-4 rounded-sm border border-background-focus bg-background-card p-5 md:p-6">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.01em]">AI credits</h2>
        <p className="mt-1 text-sm text-foreground-off">
          {balance?.serviceOpenRouterAvailable
            ? "Try OpenRouter with credits funded by Eclipse. Your balance grows by 300 credits each month."
            : "Your balance grows by 300 credits each month. Eclipse-funded OpenRouter is not enabled on this server yet."}
        </p>
      </div>

      {error ? <p role="alert" className="text-xs text-priority-high">{error}</p> : null}
      {balance ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3 rounded-sm bg-background-focus/40 p-4">
            <div>
              <p className="text-2xl font-semibold tabular-nums">{balance.availableCredits.toLocaleString()} credits</p>
              <p className="mt-1 text-xs text-foreground-off">Available · {balance.reservedCredits.toLocaleString()} reserved</p>
            </div>
            <p className="text-xs text-foreground-off">1,000 credits = $1.00 USD</p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium">Recent activity</h3>
            {balance.entries.length ? balance.entries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between gap-3 border-b border-background-focus py-2 text-xs last:border-0">
                <div>
                  <p>{entryLabels[entry.type]}</p>
                  <p className="mt-0.5 text-[10px] text-foreground-off">{new Date(entry.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right tabular-nums">
                  <p>{entry.deltaCredits > 0 ? "+" : ""}{entry.deltaCredits}</p>
                  {entry.amountUsd ? <p className="mt-0.5 text-[10px] text-foreground-off">${entry.amountUsd} USD</p> : null}
                </div>
              </div>
            )) : <p className="text-xs text-foreground-off">No credit activity yet.</p>}
          </div>
        </>
      ) : !error ? <p role="status" className="text-xs text-foreground-off">Loading credit balance…</p> : null}
    </section>
  );
}
