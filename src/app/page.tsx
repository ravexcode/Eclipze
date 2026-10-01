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
      <section className="mx-auto grid min-h-[calc(100dvh-5rem)] w-full max-w-7xl grid-cols-1 items-center gap-10 overflow-hidden lg:-translate-y-5 lg:grid-cols-[40.4%_59.6%] lg:gap-0">
        <div className="relative z-10 px-7 py-10 animate-blurred-fade-in lg:py-0">
          <div className="max-w-97.5">
            <h1 className="font-base text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.055em] text-foreground sm:text-[3rem]">
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
                href="/about"
                className="h-8 min-h-0 cursor-pointer px-3">
                Learn more
              </Button>
            </div>
          </div>
        </div>

        <Image
          src="/images/dashboard.webp"
          alt="Eclipze dashboard showing issues, projects, and agent sessions"
          className="aspect-763/421 h-auto w-full object-cover animate-fade-in-up animate-duration-700"
          width={1920}
          height={926}
          priority
        />
      </section>
    </MarketingLayout>
  );
}
