"use client";

import Image from "next/image";
import Link from "next/link";

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-xs px-2 py-1 text-xs text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
      {children}
    </Link>
  );
}

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
      className="mx-auto flex w-full max-w-[1320px] items-center justify-between border-b border-background-focus px-5 py-4 animate-fade-in-down sm:px-8 lg:px-10">
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

      <div
        className="hidden items-center justify-center gap-3 text-sm sm:flex">
        <HeaderLink
          href="#">
          Product
        </HeaderLink>
        <HeaderLink
          href="#">
          Pricing
        </HeaderLink>
        <HeaderLink
          href="#">
          About us
        </HeaderLink>
      </div>

      <Link
        href={cta.link}
        className="rounded-xs bg-accent px-4 py-2 text-center text-xs font-medium text-foreground transition-colors hover:bg-accent-strong focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent">
        {cta.label}
      </Link>
    </header>
  )
}
