import type { Metadata } from "next";

import LegalDocument from "@/components/legal/legal-document";
import { getCurrentLegalVersion } from "@/utils/legal";

const currentVersion = getCurrentLegalVersion("privacy");

export const metadata: Metadata = {
  title: currentVersion.title,
  description: currentVersion.description,
};

export default function PrivacyNoticePage() {
  return (
    <LegalDocument
      document="privacy"
      version={currentVersion} />
  );
}
