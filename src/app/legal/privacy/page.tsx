import type { Metadata } from "next";

import LegalDocument from "@/components/legal/legal-document";
import { PRIVACY_NOTICE } from "@/constants/legal";

export const metadata: Metadata = {
  title: PRIVACY_NOTICE.title,
  description: PRIVACY_NOTICE.description,
};

export default function PrivacyNoticePage() {
  return (
    <LegalDocument
      title={PRIVACY_NOTICE.title}
      intro={PRIVACY_NOTICE.intro}
      sections={PRIVACY_NOTICE.sections}
      current="privacy"
    />
  );
}
