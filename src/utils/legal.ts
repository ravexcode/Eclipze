import { LEGAL_DATE_FORMATTER, LEGAL_DOCUMENTS } from "@/constants/legal";
import type { LegalDocumentKey } from "@/types/legal";

export function getCurrentLegalVersion(document: LegalDocumentKey) {
  return LEGAL_DOCUMENTS[document].versions[0];
}

export function findLegalVersion(document: LegalDocumentKey, version: string) {
  return LEGAL_DOCUMENTS[document].versions.find(entry => entry.version === version) ?? null;
}

export function getLegalVersionPath(document: LegalDocumentKey, version: string) {
  const definition = LEGAL_DOCUMENTS[document];

  if (version === getCurrentLegalVersion(document).version) {
    return definition.path;
  }

  return `${definition.path}/${version}`;
}

export function formatLegalVersionDate(version: string) {
  return LEGAL_DATE_FORMATTER.format(new Date(`${version}T00:00:00Z`));
}
