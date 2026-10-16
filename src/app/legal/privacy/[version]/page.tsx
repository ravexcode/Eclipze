import type { Metadata } from "next";
import { notFound } from "next/navigation";

import LegalDocument from "@/components/legal/legal-document";
import { LEGAL_DOCUMENTS } from "@/constants/legal";
import {
  findLegalVersion,
  formatLegalVersionDate,
} from "@/utils/legal";

type PrivacyNoticeVersionPageProps = {
  params: Promise<{ version: string }>;
};

export const dynamicParams = false;

// The current version is served from the document's base path.
export function generateStaticParams() {
  const archivedVersions = LEGAL_DOCUMENTS.privacy.versions.slice(1);

  return archivedVersions.map(entry => ({
    version: entry.version,
  }));
}

export async function generateMetadata({ params }: PrivacyNoticeVersionPageProps): Promise<Metadata> {
  const { version } = await params;
  const legalVersion = findLegalVersion("privacy", version);

  if (!legalVersion) {
    return {};
  }

  return {
    title: `${legalVersion.title} (${formatLegalVersionDate(legalVersion.version)})`,
    description: legalVersion.description,
  };
}

export default async function PrivacyNoticeVersionPage({ params }: PrivacyNoticeVersionPageProps) {
  const { version } = await params;
  const legalVersion = findLegalVersion("privacy", version);

  if (!legalVersion) {
    notFound();
  }

  return (
    <LegalDocument
      document="privacy"
      version={legalVersion} />
  );
}
