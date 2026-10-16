"use client";

import { useState } from "react";
import Link from "next/link";
import { IconExternalLink } from "@tabler/icons-react";

import { LEGAL_DATE_FORMATTER, LEGAL_DOCUMENTS } from "@/constants/legal";
import type { LegalAcceptance, LegalDocumentKey } from "@/types/legal";
import {
  formatLegalVersionDate,
  getCurrentLegalVersion,
  getLegalVersionPath,
} from "@/utils/legal";
import SettingsRow from "./settings-row";

export default function LegalAgreementRow(props: {
  document: LegalDocumentKey;
  // Acceptances for this document, newest first.
  acceptances: LegalAcceptance[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const definition = LEGAL_DOCUMENTS[props.document];
  const currentVersion = getCurrentLegalVersion(props.document);
  const latestAcceptance = props.acceptances[0] ?? null;
  const panelId = `legal-${props.document}-versions`;

  const acceptedAtByVersion = new Map(
    props.acceptances.map(acceptance => [acceptance.version, acceptance.acceptedAt]),
  );

  const detail = latestAcceptance
    ? `Accepted the ${formatLegalVersionDate(latestAcceptance.version)} version on ${LEGAL_DATE_FORMATTER.format(new Date(latestAcceptance.acceptedAt))}`
    : "No acceptance recorded yet. It will be recorded the next time you sign in.";

  const status = !latestAcceptance
    ? <span className="text-foreground-off">Not recorded</span>
    : latestAcceptance.version === currentVersion.version
      ? <span className="text-foreground-off">Up to date</span>
      : <span className="text-priority-medium">New version</span>;

  return (
    <section className="flex flex-col gap-1">
      <SettingsRow
        title={definition.title}
        detail={detail}
        action={status}
        expanded={isOpen}
        controls={panelId}
        onClick={() => setIsOpen(open => !open)} />
      {isOpen ? (
        <ol
          id={panelId}
          className="flex flex-col gap-2 rounded-lg border border-background-focus bg-background-card p-4">
          {definition.versions.map(entry => {
            const acceptedAt = acceptedAtByVersion.get(entry.version);
            const isCurrent = entry.version === currentVersion.version;

            return (
              <li
                key={entry.version}
                className="flex items-start justify-between gap-3 text-xs">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-medium text-foreground">
                      {formatLegalVersionDate(entry.version)}
                    </span>
                    {isCurrent ? (
                      <span className="text-accent">Current</span>
                    ) : null}
                    {acceptedAt ? (
                      <span className="text-foreground-off">
                        Accepted on {LEGAL_DATE_FORMATTER.format(new Date(acceptedAt))}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-foreground-off">{entry.summary}</span>
                </span>
                <Link
                  href={getLegalVersionPath(props.document, entry.version)}
                  target="_blank"
                  className="inline-flex shrink-0 items-center gap-1 text-foreground-off underline transition-colors hover:text-foreground">
                  View
                  <IconExternalLink size={13} strokeWidth={1.6} />
                </Link>
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
