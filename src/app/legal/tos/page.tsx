import type { Metadata } from "next";

import LegalDocument from "@/components/legal/legal-document";
import { TERMS_OF_SERVICE } from "@/constants/legal";

export const metadata: Metadata = {
  title: TERMS_OF_SERVICE.title,
  description: TERMS_OF_SERVICE.description,
};

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      title={TERMS_OF_SERVICE.title}
      intro={TERMS_OF_SERVICE.intro}
      sections={TERMS_OF_SERVICE.sections}
      current="terms"
    />
  );
}
