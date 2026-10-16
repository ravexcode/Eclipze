import type { LegalDocumentKind } from "@prisma/client";

import { LEGAL_DOCUMENT_KEYS } from "@/constants/legal";
import prisma from "@/lib/prisma";
import type { LegalAcceptance, LegalDocumentKey } from "@/types/legal";
import { getCurrentLegalVersion } from "@/utils/legal";

const DOCUMENT_KIND_BY_KEY: Record<LegalDocumentKey, LegalDocumentKind> = {
  terms: "TERMS",
  privacy: "PRIVACY",
};

const DOCUMENT_KEY_BY_KIND: Record<LegalDocumentKind, LegalDocumentKey> = {
  TERMS: "terms",
  PRIVACY: "privacy",
};

// Signing in accepts the versions in effect at that moment. Versions the user
// already accepted keep their original acceptance date.
export async function recordCurrentLegalAcceptance(userId: string) {
  await prisma.legalAcceptance.createMany({
    data: LEGAL_DOCUMENT_KEYS.map(document => ({
      userId,
      document: DOCUMENT_KIND_BY_KEY[document],
      version: getCurrentLegalVersion(document).version,
    })),
    skipDuplicates: true,
  });
}

export async function getLegalAcceptances(userId: string): Promise<LegalAcceptance[]> {
  const acceptances = await prisma.legalAcceptance.findMany({
    where: {
      userId,
    },
    orderBy: {
      acceptedAt: "desc",
    },
  });

  return acceptances.map(acceptance => ({
    document: DOCUMENT_KEY_BY_KIND[acceptance.document],
    version: acceptance.version,
    acceptedAt: acceptance.acceptedAt.toISOString(),
  }));
}
