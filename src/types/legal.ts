export type LegalDocumentKey = "terms" | "privacy";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  links?: Array<{ label: string; href: string }>;
};

export type LegalDocumentVersion = {
  // ISO date (YYYY-MM-DD) the version took effect; also used in the version URL.
  version: string;
  summary: string;
  title: string;
  description: string;
  intro: string;
  sections: LegalSection[];
};

export type LegalDocumentDefinition = {
  key: LegalDocumentKey;
  title: string;
  path: string;
  // Ordered from newest to oldest; the first entry is the current version.
  versions: LegalDocumentVersion[];
};

export type LegalAcceptance = {
  document: LegalDocumentKey;
  version: string;
  acceptedAt: string;
};
