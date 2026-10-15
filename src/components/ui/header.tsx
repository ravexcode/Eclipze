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
      className="mx-auto flex w-185 items-center justify-between rounded-md backdrop-blur-sm backdrop-brightness-60 px-5 py-2 animate-fade-in-down z-100 top-7 sticky duration-200">
      <Link
        href="/"
        aria-label="Eclipze home">
        <Image
          src="/logo.svg"
          alt="Eclipze Logo"
          width={25}
          height={25}
          loading="eager"
        />
      </Link>

      <Button
        variant="main"
        href={cta.link}
        className="w-30 text-xs! rounded-md!">
        {cta.label}
      </Button>
    </header>
  )
}
