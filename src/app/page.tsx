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
        className="absolute top-0 left-0 w-full h-max bg-cover contrast-125 brightness-75 animate-fade-in" />

      <section className="mx-auto w-full max-w-7xl overflow-hidden p-10 gap-10 flex flex-col items-center justify-between relative">
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
          src="/images/marketing_dashboard.webp"
          className="w-full rounded-md animate-fade-in-up animate-duration-700"
          alt="Marketing dashboard"
          width={1336}
          height={910}
          loading="eager" />
      </section>

      <section
        className="flex flex-col items-center justify-center gap-2 p-10 w-full max-w-6xl mx-auto mt-50 animate-fade-in-up">
        <p
          className="text-3xl font-sembibold w-full text-start">
          Work with Agents
        </p>
        <p
          className="w-full font-medium text-start text-base mb-10 text-foreground-off">
          Add skills, projects, Github repositories for context. And create issues, fix them, check your inbox and even MCP connections.
        </p>

        <Image
          src="/images/agents.webp"
          className="w-full rounded-md animate-fade-in-up animate-duration-700"
          alt="Marketing agents page"
          width={1336}
          height={910}
          loading="eager" />
      </section>

      <section
        className="flex flex-col items-center justify-center gap-2 p-10 w-full max-w-6xl mx-auto animate-fade-in-up">
        <p
          className="text-3xl font-sembibold w-full text-start">
          Organize your projects
        </p>
        <p
          className="w-full font-medium text-start text-base mb-10 text-foreground-off">
          Create, delete and edit your projects to work with them.
        </p>

        <Image
          src="/images/projects.webp"
          className="w-full rounded-md animate-fade-in-up animate-duration-700"
          alt="Marketing projects page"
          width={1336}
          height={910}
          loading="eager" />
      </section>
    </MarketingLayout>
  );
}
