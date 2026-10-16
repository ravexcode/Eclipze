"use client";

import { useEffect, useState } from "react";

import { LEGAL_DOCUMENT_KEYS } from "@/constants/legal";
import type { LegalAcceptance } from "@/types/legal";
import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";
import LegalAgreementRow from "./legal-agreement-row";
import SettingsRow from "./settings-row";
import SettingsSection from "./settings-section";

export default function LegalAgreementsSection() {
  const [acceptances, setAcceptances] = useState<LegalAcceptance[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void apiFetch("/api/legal/acceptances", { cache: "no-store" })
      .then(async (response) => {
        const payload = await readJson(response) as { acceptances: LegalAcceptance[]; message?: string };
        if (cancelled) return;
        if (!response.ok) throw new Error(payload.message ?? "Unable to load legal agreements.");
        setAcceptances(payload.acceptances);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load legal agreements.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SettingsSection
      title="Legal"
      description="The versions you accepted when signing in, and every previous version of each document.">
      {acceptances ? (
        LEGAL_DOCUMENT_KEYS.map(document => (
          <LegalAgreementRow
            key={document}
            document={document}
            acceptances={acceptances.filter(acceptance => acceptance.document === document)} />
        ))
      ) : error ? (
        <SettingsRow title="Legal agreements" action={<span className="text-alert-red">Unavailable</span>} />
      ) : (
        <SettingsRow title="Legal agreements" action={<span role="status" className="text-foreground-off">Loading...</span>} />
      )}
      {error ? <p role="alert" className="text-xs text-alert-red">{error}</p> : null}
    </SettingsSection>
  );
}
