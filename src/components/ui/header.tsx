"use client";

import Image from "next/image";
import Link from "next/link";

import { useState, useEffect } from "react";
import { getSessionUser } from "@/utils/session";

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

export default function Header() {
  const [cta, setCta] = useState<CtaValues>(SIGNED_OUT_CTA);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const user = await getSessionUser();

      if (cancelled) return;

      if (user) {
        setCta(SIGNED_IN_CTA);
      } else {
        setCta(SIGNED_OUT_CTA);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header
      className="sticky top-3 mt-3 min-w-3xl w-full max-w-5xs rounded-sm p-4 animate-fade-in-down flex justify-between items-center backdrop-blur z-2">
        <Image
          src="/logo.svg"
          alt="Eclipse Logo"
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
