"use client";

import type { WorkspaceAgentSession } from "@/types/user";
import { IconClock, IconLayoutSidebar, IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import SessionRow from "./session-row";
import { groupSessions } from "./types";

export default function SessionsSidebar({
  open,
  isLoading,
  sessions,
  selectedSession,
  onClose,
  onNewSession,
  onSelectSession,
}: {
  open: boolean;
  isLoading: boolean;
  sessions: WorkspaceAgentSession[];
  selectedSession: string | null;
  onClose: () => void;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(!open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setMounted(false);
        setClosing(false);
      } else {
        setClosing(true);
      }
    }
  }, [mounted, open]);

  if (!mounted) return null;

  const groupedSessions = groupSessions(sessions);
  const animationClasses = closing
    ? "animate-slide-out-right animate-duration-180 animate-ease-out pointer-events-none"
    : "animate-slide-in-right animate-duration-180 animate-ease-out";

  return (
    <aside
      className={
        "absolute inset-y-0 right-0 z-20 flex w-full max-w-80 flex-col border-l border-background-focus bg-background-card " +
        animationClasses +
        " motion-reduce:animate-none"
      }
      onAnimationEnd={(event) => {
        if (closing && event.animationName === "slide-out-right") {
          setMounted(false);
        }
      }}
      aria-hidden={closing}>
      <div className="flex items-center justify-between border-b border-background-focus px-4 py-3">
        <div>
          <p className="text-sm font-medium">Sessions</p>
          <p className="mt-0.5 text-xs text-foreground-off">
            {sessions.length} saved {sessions.length === 1 ? "session" : "sessions"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm p-2 text-foreground-off hover:bg-background-focus hover:text-foreground"
          aria-label="Close sessions sidebar">
          <IconLayoutSidebar size={17} strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2" aria-label="Loading sessions">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-sm bg-background-focus/50"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <IconClock
              size={20}
              className="text-foreground-off"
              strokeWidth={1.6}
            />
            <p className="mt-3 text-sm">No sessions yet</p>
            <p className="mt-1 text-xs leading-5 text-foreground-off">
              Your agent tasks will appear here after you send the first one.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(groupedSessions).map(([label, items]) => (
              <section key={label}>
                <p className="px-3 pb-1.5 text-[11px] uppercase tracking-[0.12em] text-foreground-off">
                  {label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {items.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      selected={selectedSession === session.id}
                      onSelect={() => onSelectSession(session.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-background-focus p-3">
        <button
          type="button"
          onClick={onNewSession}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-background-focus px-3 py-2 text-xs text-foreground-off hover:text-foreground">
          <IconPlus size={15} />
          New session
        </button>
      </div>
    </aside>
  );
}
