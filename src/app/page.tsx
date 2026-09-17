import Image from "next/image";
import Link from "next/link";
import { IconArrowDown, IconArrowUpRight } from "@tabler/icons-react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import MarketingLayout from "@/components/layouts/marketing";

export default async function HomePage() {
  const cookieStore = await cookies();

  const hasToken = !!cookieStore.get("token");

  if (hasToken) redirect("/dashboard");

  return (
    <MarketingLayout>
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[52%] top-[16%] -z-10 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]"
        />

        <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-7xl flex-col justify-center gap-14 px-6 py-16 sm:px-10 lg:grid lg:grid-cols-[minmax(21rem,0.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-16 lg:px-12 lg:py-20">
          <div className="relative z-10 max-w-xl animate-blurred-fade-in">
            <div className="mb-7 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-foreground-off">
              <span className="h-px w-8 bg-accent" />
              <span>Developer workflow platform</span>
            </div>

            <h1 className="max-w-[13ch] font-heading text-5xl font-bold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-[4rem] 2xl:text-[4.4rem]">
              Build faster.
              <br />
              Deploy with
              <br />
              <span className="text-accent">confidence.</span>
            </h1>

            <p className="mt-7 max-w-md text-base leading-7 text-foreground-off sm:text-lg">
              A focused workspace for projects, issues, mail, and AI agents —
              built to keep your team moving.
            </p>

            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href="/auth"
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-accent px-5 py-3 text-sm font-semibold text-foreground transition duration-300 hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Start building
                <IconArrowUpRight
                  aria-hidden="true"
                  size={17}
                  stroke={1.8}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="#workspace"
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-background-focus px-5 py-3 text-sm font-semibold text-foreground-off transition duration-300 hover:border-foreground-off hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                See the workspace
                <IconArrowDown
                  aria-hidden="true"
                  size={16}
                  stroke={1.8}
                  className="transition-transform duration-300 group-hover:translate-y-0.5"
                />
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-3 border-t border-background-focus pt-4 text-xs text-foreground-off">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#34c759]" />
              <span>One calm place for the work that ships.</span>
            </div>
          </div>

          <div
            id="workspace"
            className="relative w-full animate-fade-in-up motion-reduce:animate-none"
          >
            <div className="absolute -inset-3 rounded-lg border border-accent/20" />
            <div className="relative overflow-hidden rounded-sm border border-background-focus bg-background-card p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.48)] sm:p-2">
              <div className="flex h-7 items-center justify-between border-b border-background-focus px-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-foreground-off sm:px-3">
                <span>Eclipse / Overview</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34c759]" />
                  Live workspace
                </span>
              </div>
              <Image
                src="/images/dashboard.webp"
                alt="Eclipse dashboard showing issues, projects, and agent sessions"
                className="h-auto w-full"
                width={1000}
                height={600}
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority
              />
            </div>
            <p className="mt-3 text-right font-heading text-[10px] uppercase tracking-[0.14em] text-foreground-off">
              Everything in view. Nothing in the way.
            </p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
