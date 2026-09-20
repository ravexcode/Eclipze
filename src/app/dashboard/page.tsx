"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";

import {
  IconActivity,
  IconArrowUpRight,
  IconBug,
  IconFolders,
  IconSparkles,
} from "@tabler/icons-react";

import { useRouter } from "next/navigation";

export default function OverviewPage() {
  const router = useRouter();

  return (
    <DashLayout
      current="overview"
      router={router}>
      <main className="w-full min-w-0">
        <Heading label="Overview" />

        <div className="mx-auto flex w-full max-w-[980px] flex-col gap-10 px-5 py-8 sm:px-8 lg:py-10">
          <section className="flex flex-col gap-3 animate-fade-in-up">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-base font-semibold tracking-[-0.02em]">Current issues</p>
                <p className="mt-1 text-xs text-foreground-off">A clear view of what needs attention.</p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/issues")}
                className="inline-flex items-center gap-1 rounded-xs px-2 py-1 text-xs text-foreground-off transition-colors hover:bg-surface-raised hover:text-foreground">
                Open issues
                <IconArrowUpRight size={14} strokeWidth={1.8} />
              </button>
            </div>

            <article className="grid gap-px overflow-hidden rounded-xs border border-background-focus bg-background-focus sm:grid-cols-[minmax(0,1fr)_180px]">
              <div className="bg-surface p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs text-foreground-off">
                  <IconBug size={16} strokeWidth={1.8} />
                  <p>Issue activity</p>
                </div>

                <div className="mt-8 flex h-24 items-center justify-center border-y border-dashed border-background-focus px-1">
                  <p className="text-[11px] text-foreground-off">No activity to chart yet.</p>
                </div>

                <p className="mt-3 text-xs text-foreground-off">
                  No issue data yet. Activity will appear here when your workspace is connected.
                </p>
              </div>

              <div className="flex flex-col justify-between bg-surface-raised p-5 sm:p-6">
                <p className="text-xs text-foreground-off">Total issues</p>
                <p className="text-4xl font-normal tracking-[-0.06em]">0</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-foreground-off">
                  <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-priority-high" />Important 0</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-priority-medium" />Medium 0</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-foreground-off" />Low 0</span>
                </div>
              </div>
            </article>
          </section>

          <section className="flex flex-col gap-3 animate-fade-in-up">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-base font-semibold tracking-[-0.02em]">Projects</p>
                <p className="mt-1 text-xs text-foreground-off">Keep the work that matters within reach.</p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/projects")}
                className="inline-flex items-center gap-1 rounded-xs px-2 py-1 text-xs text-foreground-off transition-colors hover:bg-surface-raised hover:text-foreground">
                View projects
                <IconArrowUpRight size={14} strokeWidth={1.8} />
              </button>
            </div>

            <article className="rounded-xs border border-background-focus bg-surface p-5 sm:p-6">
              <div className="flex items-start justify-between gap-5">
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-status-cyan" />
                  <div>
                    <p className="text-sm font-semibold">No projects yet</p>
                    <p className="mt-2 max-w-xl text-xs leading-5 text-foreground-off">
                      Your projects will appear here once real project data is connected.
                    </p>
                  </div>
                </div>
                <IconFolders className="shrink-0 text-foreground-off" size={18} strokeWidth={1.7} />
              </div>
            </article>
          </section>

          <section className="flex flex-col gap-3 animate-fade-in-up">
            <div>
              <p className="text-base font-semibold tracking-[-0.02em]">Agent sessions</p>
              <p className="mt-1 text-xs text-foreground-off">Recent runs from the agents in your workspace.</p>
            </div>

            <article className="rounded-xs border border-background-focus bg-surface p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <IconSparkles className="mt-0.5 shrink-0 text-foreground-off" size={18} strokeWidth={1.7} />
                <div>
                  <p className="text-sm font-semibold">No agent sessions yet</p>
                  <p className="mt-2 text-xs leading-5 text-foreground-off">
                    Sessions will appear here when an agent has run in this workspace.
                  </p>
                </div>
              </div>
            </article>

            <div className="hidden items-center gap-2 text-[11px] text-foreground-off sm:flex">
              <IconActivity size={14} strokeWidth={1.7} />
              <span>Live workspace activity will be available when connected.</span>
            </div>
          </section>
        </div>
      </main>
    </DashLayout>
  );
}
