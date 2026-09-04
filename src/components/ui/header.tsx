import Image from "next/image";
import Link from "next/link";

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-foreground-off hover:text-foreground duration-300 p-2">
      {children}
    </Link>
  );
}

export default function Header() {
  return (
    <header
      className="sticky top-0 min-w-3xl w-full max-w-5xs border-b border-background-focus p-4 animate-fade-in-down flex justify-between items-center backdrop-blur">
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
        href="#"
        className="rounded-sm w-25 bg-accent hover:brightness-75 duration-300 text-foreground text-center p-1.5 text-sm">
        Sign in
      </Link>
    </header>
  )
}
