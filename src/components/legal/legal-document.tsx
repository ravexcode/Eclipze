import Image from "next/image";
import Link from "next/link";

import type { LegalSection } from "@/constants/legal";

type LegalDocumentProps = {
  title: string;
  intro: string;
  sections: LegalSection[];
  current: "terms" | "privacy";
};

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/legal/tos", key: "terms" },
  { label: "Privacy Notice", href: "/legal/privacy", key: "privacy" },
] as const;

export default function LegalDocument({
  title,
  intro,
  sections,
  current,
}: LegalDocumentProps) {
  return (
    <main lang="en" className="min-h-dvh bg-background px-5 pb-16 pt-6 sm:px-8 sm:pt-10">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 border-b border-background-focus pb-5">
        <Link href="/" aria-label="Eclipze home" className="shrink-0 rounded-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
          <Image src="/logo.svg" alt="Eclipze" width={28} height={28} />
        </Link>

        <nav aria-label="Legal documents" className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm text-foreground-off">
          {LEGAL_LINKS.map(link => (
            <Link
              key={link.key}
              href={link.href}
              aria-current={current === link.key ? "page" : undefined}
              className={current === link.key
                ? "text-foreground"
                : "transition-colors hover:text-foreground"}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <article className="mx-auto w-full max-w-3xl">
        <div className="border-b border-background-focus py-12 sm:py-16">
          <p className="mb-3 text-sm text-foreground-off">Legal · Nuevo León, Mexico</p>
          <h1 className="font-base text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-off">{intro}</p>
          <p className="mt-6 text-xs text-foreground-off">Draft for review · October 2, 2026</p>
        </div>

        <aside className="my-8 rounded-sm border border-accent/40 bg-background-card p-5 sm:p-6">
          <h2 className="text-base font-medium">Completion needed</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-off">
            This draft reflects the application code and the operator details provided so far. Before publishing it, confirm the operator's full address, service providers and infrastructure, retention periods, and final legal wording.
          </p>
        </aside>

        <div className="space-y-9">
          {sections.map(section => (
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

        <footer className="mt-12 border-t border-background-focus pt-6 text-sm text-foreground-off">
          <p>
            Operator: Jose Rafael Martinez Bocanegra ·{" "}
            <a className="text-foreground underline underline-offset-4" href="mailto:contact@ravexcode.com">
              contact@ravexcode.com
            </a>
          </p>
          <p className="mt-2">Service location: Nuevo León, Mexico. The full address still needs to be added.</p>
          <Link href="/auth/signin" className="mt-6 inline-flex rounded-xs py-2 underline underline-offset-4 transition-colors hover:text-foreground">
            Back to sign in
          </Link>
        </footer>
      </article>
    </main>
  );
}
