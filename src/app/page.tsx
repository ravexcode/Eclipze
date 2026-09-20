import Image from "next/image";
import { IconArrowRight } from "@tabler/icons-react";

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
      <section className="relative w-full overflow-hidden px-5 py-16 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto grid w-full max-w-[1320px] items-center gap-14 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-16">
          <div className="relative z-10 max-w-xl animate-blurred-fade-in">

            <p className="mb-5 font-heading text-xs uppercase tracking-[0.18em] text-foreground-off">
              Developer workflow, without the noise
            </p>

            <h1 className="max-w-[520px] font-heading text-5xl font-normal leading-[0.98] tracking-[-0.06em] text-foreground sm:text-6xl lg:text-[4.4rem]">
              Build faster. <br />
              Deploy with <br />
              <span className="text-accent-strong">confidence.</span>
            </h1>

            <p className="mt-7 max-w-md text-sm leading-6 text-foreground-off sm:text-base">
              A focused workspace for projects, issues, and AI agents —
              built to keep your team moving.
            </p>

            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Button
                variant="main"
                href="/auth"
                className="h-10 w-30 cursor-pointer">
                Start
              </Button>
              <Button
                variant="ghost"
                href="/about"
                className="h-10 w-40 cursor-pointer">
                Learn more
                <IconArrowRight
                  size={16}
                  stroke={1.8}
                />
              </Button>
            </div>
          </div>

          <Image
            src="/images/dashboard.webp"
            alt="Eclipze dashboard showing issues, projects, and agent sessions"
            className="h-auto w-full rounded-xs border border-background-focus object-cover animate-fade-in-up animate-duration-700"
            width={1000}
            height={600}
            priority
          />
        </div>
      </section>
    </MarketingLayout>
  );
}
