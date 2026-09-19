"use client";

import Image from "next/image";
import Link from "next/link";

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-foreground-off hover:text-foreground hover:scale-110 duration-300 p-2">
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
      className="sticky top-3 mt-3 mx-auto w-full max-w-5xl rounded-sm p-4 animate-fade-in-down flex justify-between items-center backdrop-blur z-2">
        <Image
          src="/logo.svg"
          alt="Eclipze Logo"
          width={25}
          height={25}
      />

      <div
        className="flex items-center justify-center gap-7 text-sm">
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
        className="rounded-sm w-25 bg-accent hover:brightness-75 duration-300 text-foreground text-center p-1.5 text-sm">
        {cta.label}
      </Link>
    </header>
  )
}
