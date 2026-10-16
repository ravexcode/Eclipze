import Image from "next/image";
import Link from "next/link";

import { LEGAL_DOCUMENTS } from "@/constants/legal";
import type { LegalDocumentKey, LegalDocumentVersion } from "@/types/legal";
import {
  formatLegalVersionDate,
  getCurrentLegalVersion,
  getLegalVersionPath,
} from "@/utils/legal";

type LegalDocumentProps = {
  document: LegalDocumentKey;
  version: LegalDocumentVersion;
};

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/legal/tos", key: "terms" },
  { label: "Privacy Notice", href: "/legal/privacy", key: "privacy" },
] as const;

export default function LegalDocument({
  document,
  version,
}: LegalDocumentProps) {
  const definition = LEGAL_DOCUMENTS[document];
  const currentVersion = getCurrentLegalVersion(document);
  const isCurrent = version.version === currentVersion.version;
  const updatedLabel = formatLegalVersionDate(version.version);

  return (
    <main lang="en" className="min-h-dvh bg-background px-5 pb-16 pt-6 sm:px-8 sm:pt-10">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 border-b border-background-focus pb-5">
        <Link href="/" aria-label="Eclipze home" className="shrink-0 rounded-md focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
          <Image src="/logo.svg" alt="Eclipze" width={28} height={28} />
        </Link>

        <nav aria-label="Legal documents" className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-xs text-foreground-off">
          {LEGAL_LINKS.map(link => (
            <Link
              key={link.key}
              href={link.href}
              aria-current={document === link.key && isCurrent ? "page" : undefined}
              className={document === link.key
                ? "text-foreground"
                : "transition-colors hover:text-foreground"}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <article className="mx-auto w-full max-w-3xl">
        <div className="border-b border-background-focus py-6 mb-6">
          <p className="mb-3 text-xs text-foreground-off">Legal · Nuevo León, Mexico</p>
          <h1 className="font-base text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{version.title}</h1>
          <p className="mt-4 max-w-2xl text-xs leading-7 text-foreground-off">{version.intro}</p>
          <p className="mt-6 text-xs text-foreground-off">
            Draft for review · Last updated{" "}
            <time dateTime={version.version}>{updatedLabel}</time>
          </p>
        </div>

        {isCurrent ? null : (
          <aside className="mt-8 rounded-md border border-priority-medium/40 bg-background-card p-5 sm:p-6">
            <h2 className="text-xs font-medium">Archived version</h2>
            <p className="mt-2 text-xs leading-6 text-foreground-off">
              You are viewing the version of the {definition.title} updated on {updatedLabel}. It is no longer in effect.{" "}
              <Link
                href={definition.path}
                className="text-foreground underline underline-offset-4 transition-colors hover:text-accent"
              >
                View the current version
              </Link>
              .
            </p>
          </aside>
        )}

        <div className="space-y-9">
          {version.sections.map(section => (
            <section key={section.title} className="scroll-mt-8">
              <h2 className="text-xl font-medium tracking-[-0.02em]">{section.title}</h2>
              <div className="mt-3 space-y-4 text-[15px] leading-7 text-foreground-off">
                {section.paragraphs.map(paragraph => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.links?.length ? (
                  <ul className="space-y-2">
                    {section.links.map(link => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-foreground underline underline-offset-4 transition-colors hover:text-accent"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        <section id="version-history" className="mt-12 scroll-mt-8 border-t border-background-focus pt-8">
          <h2 className="text-xl font-medium tracking-[-0.02em]">Version history</h2>
          <ol className="mt-4 space-y-3">
            {definition.versions.map(entry => {
              const isViewing = entry.version === version.version;
              const isEntryCurrent = entry.version === currentVersion.version;

              return (
                <li
                  key={entry.version}
                  className="rounded-md border border-background-focus bg-background-card px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {isViewing ? (
                      <span className="font-medium text-foreground" aria-current="page">
                        {formatLegalVersionDate(entry.version)}
                      </span>
                    ) : (
                      <Link
                        href={getLegalVersionPath(document, entry.version)}
                        className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-accent"
                      >
                        {formatLegalVersionDate(entry.version)}
                      </Link>
                    )}
                    {isEntryCurrent ? (
                      <span className="text-accent">Current</span>
                    ) : null}
                    {isViewing ? (
                      <span className="text-foreground-off">Viewing</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-6 text-foreground-off">{entry.summary}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <footer className="mt-12 border-t border-background-focus pt-6 text-xs text-foreground-off">
          <p>
            Operator: Jose Rafael Martinez Bocanegra ·{" "}
            <a className="text-foreground underline underline-offset-4" href="mailto:contact@ravexcode.com">
              contact@ravexcode.com
            </a>
          </p>
          <p className="mt-2">Service location: Nuevo León, Mexico. The full address still needs to be added.</p>
          <Link href="/auth/signin" className="mt-6 inline-flex rounded-md py-2 underline underline-offset-4 transition-colors hover:text-foreground">
            Back to sign in
          </Link>
        </footer>
      </article>
    </main>
  );
}
