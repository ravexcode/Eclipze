"use client";

import Image from "next/image";
import Link from "next/link";
import Button from "./button";

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
      className="mx-auto mt-2 flex w-185 items-center justify-between rounded-lg backdrop-blur backdrop-brightness-20 px-10 py-4 animate-fade-in-down z-100 top-7 sticky">
      <Link
        href="/"
        aria-label="Eclipze home">
        <Image
          src="/logo.svg"
          alt="Eclipze Logo"
          width={25}
          height={25}
        />
      </Link>

      <Button
        variant="main"
        href={cta.link}
        className="w-30">
        {cta.label}
      </Button>
    </header>
  )
}
