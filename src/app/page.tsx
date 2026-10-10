import Image from "next/image";

import { redirect } from "next/navigation";

import MarketingLayout from "@/components/layouts/marketing";
import Button from "@/components/ui/button";

import Link from "next/link";
import { IconArrowRight, IconInfoCircle } from "@tabler/icons-react";
import { getCurrentSession } from "@/lib/auth";

export default async function HomePage() {
  const hasToken = Boolean(await getCurrentSession());

  if (hasToken) redirect("/dashboard");

  return (
    <MarketingLayout hasToken={hasToken}>

      <section className="mx-auto w-full max-w-7xl overflow-hidden py-20 flex items-center justify-between">

        <div className="flex flex-col items-center justify-center text-start animate-blurred-fade-in">
          <h1 className="font-heading text-6xl w-full">
            Turn project
            <br />
            needs into
            <br />
            <span className="text-accent">focused plans</span>
          </h1>
          <p className="mt-5 w-full max-w-125 text-sm leading-6 text-foreground-off">
            Give an agent a project outcome. Keep its plan, repository work, issues, and client updates together.
          </p>

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
          alt="Eclipze workspace showing projects, issues, and agent activity"
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
            Give agents the outcome. <span className="text-accent">Review the plan.</span>
          </h2>
          <Link
            href="/agents"
            className="cursor-pointer px-3 text-foreground-off flex items-center justify-center gap-2 duration-300 hover:text-foreground">
            Explore agent workspace
            <IconArrowRight
              stroke={1}
              size={20} />
          </Link>
        </div>

      </section>

      <section className="mx-auto w-full max-w-7xl items-center py-20 flex justify-between">
        <h2 className="font-heading text-4xl w-full animate-blurred-fade-in max-w-100">
          Keep projects, issues, and client updates <span className="text-accent">in one place</span>
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
