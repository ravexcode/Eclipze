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
    <MarketingLayout>
      <section className="relative overflow-hidden w-full px-10">

        <div className="mx-auto flex w-full justify-between items-center">
          <div className="relative z-10 animate-blurred-fade-in">

            <h1 className="max-w-120 font-heading text-5xl font-bold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-[4rem] 2xl:text-[4.4rem]">
              Build faster. <br />
              Deploy with <br />
              <span className="text-accent">confidence.</span>
            </h1>

            <p className="mt-7 max-w-md text-base leading-7 text-foreground-off sm:text-lg">
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
            className="h-auto w-300 animate-fade-in-up animate-duration-700"
            width={1000}
            height={600}
            priority
          />
        </div>
      </section>
    </MarketingLayout>
  );
}
