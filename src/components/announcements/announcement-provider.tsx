"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  IconAlertCircle,
  IconCircleCheck,
  IconInfoCircle,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";

export type AnnouncementVariant = "info" | "success" | "error" | "loading";

export interface AnnouncementOptions {
  message: string;
  variant?: AnnouncementVariant;
  duration?: number;
}

interface Announcement extends Required<Pick<AnnouncementOptions, "message" | "variant">> {
  id: string;
}

interface AnnouncementContextValue {
  announce: (options: AnnouncementOptions) => string;
  dismiss: (id: string) => void;
}

const AnnouncementContext = createContext<AnnouncementContextValue | null>(null);
const DEFAULT_DURATION = 4000;
const MAX_ANNOUNCEMENTS = 4;

const variantStyles: Record<AnnouncementVariant, string> = {
  info: "border-accent/40 text-foreground",
  success: "border-green-400/40 text-green-100",
  error: "border-red-400/40 text-red-100",
  loading: "border-foreground-off/40 text-foreground",
};

function AnnouncementIcon({ variant }: { variant: AnnouncementVariant }) {
  const iconClassName = "shrink-0";

  if (variant === "success") return <IconCircleCheck className={iconClassName} size={18} aria-hidden="true" />;
  if (variant === "error") return <IconAlertCircle className={iconClassName} size={18} aria-hidden="true" />;
  if (variant === "loading") return <IconLoader2 className={`${iconClassName} animate-spin`} size={18} aria-hidden="true" />;
  return <IconInfoCircle className={iconClassName} size={18} aria-hidden="true" />;
}

function AnnouncementToast({
  announcement,
  onDismiss,
}: {
  announcement: Announcement;
  onDismiss: (id: string) => void;
}) {
  const isError = announcement.variant === "error";

  return (
    <div
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-sm border bg-background-card px-4 py-3 text-sm shadow-lg animate-fade-in-down ${variantStyles[announcement.variant]}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <AnnouncementIcon variant={announcement.variant} />
      <p className="min-w-0 flex-1 leading-5">{announcement.message}</p>
      <button
        type="button"
        className="-mr-1 -mt-1 shrink-0 rounded-sm p-1 text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground focus-visible:outline-1 focus-visible:outline-accent"
        onClick={() => onDismiss(announcement.id)}
        aria-label="Dismiss announcement"
      >
        <IconX size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function AnnouncementProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const idCounter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setAnnouncements((current) => current.filter((announcement) => announcement.id !== id));

    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const announce = useCallback((options: AnnouncementOptions) => {
    const id = `announcement-${Date.now()}-${idCounter.current++}`;
    const announcement: Announcement = {
      id,
      message: options.message,
      variant: options.variant ?? "info",
    };

    setAnnouncements((current) => [...current, announcement].slice(-MAX_ANNOUNCEMENTS));

    const timer = setTimeout(() => dismiss(id), options.duration ?? DEFAULT_DURATION);
    timers.current.set(id, timer);

    return id;
  }, [dismiss]);

  const contextValue = useMemo(() => ({ announce, dismiss }), [announce, dismiss]);

  return (
    <AnnouncementContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {announcements.slice().reverse().map((announcement) => (
          <AnnouncementToast
            key={announcement.id}
            announcement={announcement}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncements() {
  const context = useContext(AnnouncementContext);

  if (!context) {
    throw new Error("useAnnouncements must be used inside AnnouncementProvider");
  }

  return context;
}
