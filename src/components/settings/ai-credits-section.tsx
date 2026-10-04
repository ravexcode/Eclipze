"use client";

import { useEffect, useState } from "react";
import { IconExternalLink } from "@tabler/icons-react";

import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";
import SettingsRow from "./settings-row";

type CreditBalance = {
  availableCredits: number;
  serviceOpenRouterAvailable: boolean;
};

export default function AiCreditsSection() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void apiFetch("/api/ai-credits", { cache: "no-store" })
      .then(async (response) => {
        const payload = await readJson(response) as CreditBalance & { message?: string };
        if (cancelled) return;
        if (!response.ok) throw new Error(payload.message ?? "Unable to load AI credits.");
        setBalance(payload);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load AI credits.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const unavailableAction = (label: string) => (
    <span
      className="inline-flex items-center gap-1 text-foreground-off"
      aria-disabled="true"
      title="Billing options are not available yet">
      {label}
      <IconExternalLink size={13} strokeWidth={1.6} />
    </span>
  );

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-sm font-medium">Billing</h2>
      <div className="flex flex-col gap-2">
        <SettingsRow
          title="Free plan"
          detail="$0 USD / month"
          action={unavailableAction("View plans")} />
        {balance ? (
          <SettingsRow
            title="Credits available"
            detail={<>${(balance.availableCredits / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</>}
            action={unavailableAction("Get more")} />
        ) : error ? (
          <SettingsRow title="Credits available" action={<span className="text-alert-red">Unavailable</span>} />
        ) : (
          <SettingsRow title="Credits available" action={<span role="status" className="text-foreground-off">Loading...</span>} />
        )}
      </div>
      {error ? <p role="alert" className="text-xs text-alert-red">{error}</p> : null}
      {balance && !balance.serviceOpenRouterAvailable ? (
        <p className="text-xs text-foreground-off">Eclipse-funded OpenRouter is not enabled on this server.</p>
      ) : null}
    </section>
  );
}
