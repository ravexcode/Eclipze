"use client";

import { useCallback, useEffect, useRef } from "react";

import { ISSUES_CACHE_DURATION, ISSUES_CACHE_INVALIDATED_EVENT } from "@/constants/cache";

/** Revalidate mounted private issue views and cancel responses from older sessions. */
export function useIssueRefresh(
  refresh: (signal: AbortSignal) => Promise<void>,
  clear: () => void,
) {
  const active = useRef(false);
  const current = useRef<{ controller: AbortController; promise: Promise<void> } | null>(null);

  const reload = useCallback((force = true) => {
    if (!active.current) return Promise.resolve();
    if (!force && current.current) return current.current.promise;
    current.current?.controller.abort();

    const controller = new AbortController();
    const promise = refresh(controller.signal).finally(() => {
      if (current.current?.controller === controller) current.current = null;
    });
    current.current = { controller, promise };
    return promise;
  }, [refresh]);

  useEffect(() => {
    active.current = true;
    const revalidate = () => {
      if (document.visibilityState === "visible") void reload(false);
    };
    const invalidate = () => {
      clear();
      void reload();
    };
    queueMicrotask(() => void reload(false));
    const timer = window.setInterval(revalidate, ISSUES_CACHE_DURATION);
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    window.addEventListener(ISSUES_CACHE_INVALIDATED_EVENT, invalidate);

    return () => {
      active.current = false;
      current.current?.controller.abort();
      current.current = null;
      window.clearInterval(timer);
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
      window.removeEventListener(ISSUES_CACHE_INVALIDATED_EVENT, invalidate);
    };
  }, [clear, reload]);

  return reload;
}
