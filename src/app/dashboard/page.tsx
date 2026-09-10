"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";

import {
  IconBellRinging,
  IconTarget
} from "@tabler/icons-react";

import { useRouter } from "next/navigation";

export default function OverviewPage() {
  const router = useRouter();

  return (
    <DashLayout
      current="overview"
      router={router}>
      <main className="w-full flex flex-col items-center justify-start gap-10">
        <Heading label="Overview" />

        <section
          className="flex flex-col w-full max-w-350 items-center justify-center gap-2 animate-fade-in-up">
          <p
            className="text-2xl font-medium w-full text-start">
            Current issues
          </p>

          <article
            className="rounded-sm bg-background-card p-4 flex gap-4 items-stretch justify-center w-full">
            <div
              className="flex flex-col gap-3 w-full rounded-sm bg-background-focus p-4">
              <div
                className="flex gap-2 items-center justify-start text-sm text-foreground-off">
                <IconBellRinging size={15} />
                <p>Current issues</p>
              </div>

              <p className="text-lg font-medium">
                No issues yet
              </p>

              <p className="text-sm text-foreground-off">
                When issue data is available, it will appear here.
              </p>
            </div>

            <div
              className="flex flex-col gap-2 w-full rounded-sm bg-background-focus p-4 justify-between">
              <p className="text-foreground-off text-sm">
                Total issues
              </p>

              <p className="text-4xl font-semibold">
                0
              </p>

              <p className="text-sm text-foreground-off">
                No issue metrics to display right now.
              </p>
            </div>
          </article>
        </section>

        <section
          className="flex flex-col w-full max-w-350 items-center justify-center gap-2 pt-5 animate-fade-in-up">
          <p
            className="text-2xl font-medium w-full text-start">
            Projects
          </p>

          <div
            className="flex flex-col gap-3 w-full rounded-sm bg-background-card p-6 text-start">
            <div
              className="flex justify-between items-center">
              <p className="font-medium text-xl">
                No projects yet
              </p>

              <div
                className="flex items-center justify-center w-max gap-2 text-foreground-off">
                <IconBellRinging size={15} />
                <IconTarget size={15} />
              </div>
            </div>

            <p className="text-foreground-off">
              Your projects will appear here once real project data is connected.
            </p>
          </div>
        </section>

      </main>
    </DashLayout>
  );
}
