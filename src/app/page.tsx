import Image from "next/image";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import MarketingLayout from "@/components/layouts/marketing";
import Button from "@/components/ui/button";

import Link from "next/link";
import { IconArrowRight, IconInfoCircle } from "@tabler/icons-react";

export default async function HomePage() {
  const cookieStore = await cookies();

  const hasToken = !!cookieStore.get("token");

  if (hasToken) redirect("/dashboard");

  return (
    <MarketingLayout hasToken={hasToken}>
      <div aria-hidden="true" className="pointer-events-none absolute top-0 -translate-y-[50%] left-1/2 -translate-x-1/2 w-150 scale-150 rounded-full blur-3xl bg-radial from-blue-400 to-50% to-accent/60 block aspect-square animate-fade-in-down -z-1" />

      <section className="mx-auto w-full max-w-7xl overflow-hidden py-20 flex items-center justify-between">

        <div className="flex flex-col items-center justify-center text-start animate-blurred-fade-in">
          <h1 className="font-heading text-6xl w-full">
            Build <span className="text-accent">Faster</span>
            <br />
            Deploy with
            <br />
            <span className="text-accent">Confidence</span>
          </h1>

          <div className="mt-6 flex items-center gap-2 w-full">
            <Button
              variant="main"
              href="/auth"
              className="cursor-pointer px-4 w-25">
              Start
            </Button>
            <Link
              href="#features"
              className="cursor-pointer px-3 text-foreground-off flex items-center justify-center gap-2 duration-300 hover:text-foreground">
              Learn more
              <IconArrowRight
                size={20} />
            </Link>
          </div>
          <p className="mt-5 flex items-center gap-1 w-full text-sm leading-6 text-foreground-off">
            <IconInfoCircle
              size={15} />
            No credit card required
          </p>
        </div>

        <Image
          src="/images/dashboard-preview.png"
          alt="Eclipze dashboard showing issues, projects, and agent sessions"
          className="animate-fade-in-up w-200 rounded-md animate-duration-700"
          width={1280}
          height={645}
        />
      </section>


      <section id="features" className="mx-auto w-full max-w-7xl items-center py-20 flex justify-between">
        <Image
          src="/images/agents-preview-anon.png"
          alt="Eclipze agent workspace with its account email anonymized"
          className="animate-fade-in-up w-200 rounded-md animate-duration-700"
          width={1767}
          height={890}
        />

        <div className="flex flex-col items-end justify-center text-end gap-3">
          <h2 className="font-heading text-4xl w-full animate-blurred-fade-in">
            Work with agents <span className="text-accent">from anywhere</span>
          </h2>
          <Link
            href="/agents"
            className="cursor-pointer px-3 text-foreground-off flex items-center justify-center gap-2 duration-300 hover:text-foreground">
            Explore the agents
            <IconArrowRight
              stroke={1}
              size={20} />
          </Link>
        </div>

      </section>

      <section className="mx-auto w-full max-w-7xl items-center py-20 flex justify-between">
        <h2 className="font-heading text-4xl w-full animate-blurred-fade-in max-w-100">
          Improve project <span className="text-accent">communication</span>
        </h2>
        <Image
          src="/images/inbox-preview-anon.png"
          alt="Eclipze inbox screenshot with message names and emails anonymized"
          className="animate-fade-in-up w-200 rounded-md animate-duration-700"
          width={1767}
          height={890}
        />
      </section>
    </MarketingLayout>
  );
}
