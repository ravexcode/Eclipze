import Image from "next/image";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import MarketingLayout from "@/components/layouts/marketing";
import Button from "@/components/ui/button";

export default async function HomePage() {
  const cookieStore = await cookies();

  const hasToken = !!cookieStore.get("token");

  if (hasToken) redirect("/dashboard");

  return (
    <MarketingLayout hasToken={hasToken}>
      <section className="relative mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-7xl grid-cols-1 items-center gap-10 overflow-hidden px-0 lg:grid-cols-[40.4%_59.6%] lg:gap-0">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-[8%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(12,71,180,0.42)_0%,rgba(12,71,180,0.12)_45%,transparent_72%)] blur-3xl" />
        <div className="relative z-10 px-5 py-10 animate-blurred-fade-in sm:px-7 lg:py-0">
          <div className="max-w-97.5">
            <h1 className="font-base text-[2.5rem] font-bold leading-[1.02] tracking-[-0.055em] text-foreground sm:text-[3rem]">
              Build <span className="text-accent-strong">Faster</span>
              <br />
              Deploy with
              <br />
              <span className="text-accent-strong">Confidence</span>
            </h1>

            <p className="mt-5 max-w-87.5 text-xs leading-5 text-foreground-off sm:text-sm">
              A focused workspace for projects, issues, and AI agents — built to keep your team moving.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <Button
                variant="main"
                href="/auth"
                className="h-8 min-h-0 cursor-pointer px-4">
                Start
              </Button>
              <Button
                variant="ghost"
                href="#features"
                className="h-8 min-h-0 cursor-pointer px-3">
                Learn more
              </Button>
            </div>
          </div>
        </div>

        <Image
          src="/images/dashboard-preview.png"
          alt="Eclipze dashboard showing issues, projects, and agent sessions"
          className="relative aspect-[1280/645] h-auto w-full object-contain animate-fade-in-up animate-duration-700"
          width={1280}
          height={645}
          priority
        />
      </section>

      <section id="features" className="mx-auto grid min-h-[90dvh] w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 flex min-h-[280px] items-center justify-center overflow-hidden rounded-sm bg-background-card p-3 sm:p-5 lg:order-1">
          <Image
            src="/images/agents-preview-anon.png"
            alt="Eclipze agent workspace with its account email anonymized"
            className="h-auto w-full max-w-[600px] rounded-sm object-contain"
            width={1767}
            height={890}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="max-w-xl font-mono text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">
            Work with agents <span className="text-accent">from anywhere</span>
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-6 text-foreground-off">
            Start focused tasks against connected repositories and follow their progress in one workspace.
          </p>
          <Button variant="ghost" href="/agents" className="mt-6 h-8 min-h-0 px-0 text-foreground hover:text-accent">
            Explore agents <span aria-hidden="true" className="ml-2">→</span>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid min-h-[90dvh] w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="max-w-xl font-mono text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">
            Improve project <span className="text-accent">communication</span>
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-6 text-foreground-off">
            Keep issue updates and team replies together, with a clear history for every request.
          </p>
          <Button variant="ghost" href="/inbox" className="mt-6 h-8 min-h-0 px-0 text-foreground hover:text-accent">
            Open the inbox <span aria-hidden="true" className="ml-2">→</span>
          </Button>
        </div>
        <div className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-sm bg-background-card p-3 sm:p-5">
          <Image
            src="/images/inbox-preview-anon.png"
            alt="Eclipze inbox screenshot with message names and emails anonymized"
            className="h-auto w-full max-w-[600px] rounded-sm object-contain"
            width={1767}
            height={890}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </section>
    </MarketingLayout>
  );
}
