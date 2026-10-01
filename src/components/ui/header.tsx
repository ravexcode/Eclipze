"use client";

import Image from "next/image";
import Link from "next/link";

type CtaValues = {
  link: string;
  label: string;
};

const SIGNED_OUT_CTA: CtaValues = {
  link: "/auth",
  label: "Sign in",
};

const SIGNED_IN_CTA: CtaValues = {
  link: "/dashboard",
  label: "Dashboard",
};

export default function Header({ hasToken = false }: { hasToken?: boolean }) {
  const cta = hasToken ? SIGNED_IN_CTA : SIGNED_OUT_CTA;

  return (
    <header
      className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-7 animate-fade-in-down sm:px-8">
      <Link
        href="/"
        aria-label="Eclipze home"
        className="rounded-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
        <Image
          src="/logo.svg"
          alt="Eclipze Logo"
          width={25}
          height={25}
        />
      </Link>

      <Link
        href={cta.link}
        className="rounded-xs bg-accent px-4 py-2 text-center text-xs font-medium text-foreground transition-colors hover:bg-accent-strong focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent">
        {cta.label}
      </Link>
    </header>
  )
}
