"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";
import { IconArrowLeft, IconArrowRight, IconBellRinging, IconTarget } from "@tabler/icons-react";

import { useRouter } from "next/navigation";

const fake_data = {
  issues: [
    {
      name: "Andrea requested a new fix",
      importance: "medium"
    },
    {
      name: "Elliot sent you a message",
      importance: "low"
    },
    {
      name: "Credentials compromised in John's project",
      importance: "ultra-high"
    },
    {
      name: "Daniel sent you a message",
      importance: "low"
    },
  ],
  projects: [
    {
      name: "React App",
      description: "A React application for managing tasks and projects.",
    },
    {
      name: "Web scraper",
      description: "A web scraper for extracting data from websites.",
    },
    {
      name: "Document generator",
      description: "A document generator for creating PDF documents.",
    },
  ],
}

export default function OverviewPage() {
  const router = useRouter();

  return (
    <DashLayout current="overview" router={router}>
      <main className="w-full flex flex-col items-center justify-start gap-10">
        <Heading label="Overview" />

        <section
          className="flex flex-col w-full max-w-350 items-center justify-center gap-2 animate-fade-in-up">
          <p
            className="text-2xl font-medium w-full text-start">
            Current issues
          </p>

          <article
            className="rounded-sm bg-background-card p-4 flex gap-1 items-center justify-center w-full">

            { /* Fake issues */}
            <div
              className="flex flex-col gap-3 w-full items-center justify-center relative">
              <span
                className="absolute w-full bg-linear-to-t from-background-card to-transparent z-2 h-15 bottom-0 left-0" />
              {
                fake_data.issues.map((issue, index) => (
                  <div
                    key={index}
                    className="w-full rounded-sm bg-background-focus flex justify-between items-center p-2">

                    <div
                      className="flex gap-1 items-center justify-start w-full text-sm">
                      <IconBellRinging
                        size={15}/>
                      <p>{issue.name}</p>
                    </div>

                    <div
                      className="flex gap-2 items-center justify-center w-max">
                      <span
                        className={"block rounded-full aspect-square w-2 " + (issue.importance === "high" ? "bg-red-500" : issue.importance === "low" ? "bg-green-500" : "bg-yellow-500")} />
                      <IconArrowRight
                        size={15} />
                    </div>
                  </div>
                ))
              }
            </div>

            { /* Fake graph */ }
            <div
              className="flex flex-col gap-1 w-full">
              <div className="flex flex-col gap-2 w-full items-center justify-center">
                <p
                  className="text-foreground-off w-full text-start px-10">
                  36 issues
                </p>

                <div className="flex items-end justify-center gap-2 w-full h-40">
                  <div className="block w-8 bg-accent h-1/3" />
                  <div className="block w-8 bg-accent h-2/3" />
                  <div className="block w-8 bg-accent h-1/2" />
                  <div className="block w-8 bg-accent h-full" />
                  <div className="block w-8 bg-accent h-3/4" />
                  <div className="block w-8 bg-accent h-1/4" />
                  <div className="block w-8 bg-accent h-2/5" />
                </div>
              </div>
            </div>
          </article>
        </section>

        <section
          className="flex flex-col w-full max-w-350 items-center justify-center gap-2 pt-5 animate-fade-in-up">
          <p
            className="text-2xl font-medium w-full text-start">
            Projects
          </p>

          {
            fake_data.projects.map((project, index) => (
              <div
                key={index}
                className="flex flex-col gap-1 w-full rounded-sm bg-background-card p-2 px-10 text-start">
                <div
                  className="flex justify-between items-center">
                  <p
                    className="font-medium text-xl">
                    {project.name}
                  </p>

                  <div
                    className="flex items-center justify-center w-max gap-2">
                    <IconBellRinging
                      size={15} />
                    <IconTarget
                      size={15} />
                  </div>
                </div>
                <p
                  className="text-foreground-off ">
                  {project.description}
                </p>

                <button
                  className="ml-auto flex items-center justify-center gap-2 text-sm hover:bg-background-focus rounded-sm p-2 w-20 duration-300">
                  Go
                  <IconArrowRight
                    size={15} />
                </button>
              </div>
            ))
          }
        </section>

      </main>
    </DashLayout>
  );
}
