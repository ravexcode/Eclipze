import Image from "next/image";

import { redirect } from "next/navigation";

import MarketingLayout from "@/components/layouts/marketing";

import { getCurrentSession } from "@/lib/auth";

export default async function HomePage() {
  const hasToken = Boolean(await getCurrentSession());

  if (hasToken) redirect("/dashboard");

  return (
    <MarketingLayout hasToken={hasToken}>
      <Image
        src="/images/background.webp"
        alt="Landing background"
        width={1672}
        height={941}
        loading="eager"
        className="absolute top-0 left-0 w-dvw contrast-125 brightness-75 animate-fade-in" />

      <section className="mx-auto w-full max-w-7xl overflow-hidden py-10 gap-10 flex flex-col items-center justify-between relative">
        <div
          className="w-full animate-fade-in-up">
          <p
            className="w-full text-7xl text-center font-heading font-bold animate-blurred-fade-in">
            The app built <br />
            for your agents <br />
            <span
              className="text-accent">
              Workflow
            </span>
          </p>
        </div>

        <Image
          src="/images/dashboard.webp"
          className="w-full rounded-lg animate-fade-in-up animate-duration-700"
          alt="Marketing dashboard"
          width={1920}
          height={926}
          loading="eager" />
      </section>
    </MarketingLayout>
  );
}
