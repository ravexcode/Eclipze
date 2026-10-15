"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { IconX } from "@tabler/icons-react";

interface Props {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose(): void;
  children: ReactNode;
}

const DIALOG_EXIT_DURATION_MS = 150;

export default function Dialog(props: Props) {
  const titleId = useId();
  const { isOpen, onClose } = props;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      return;
    }

    const unmountTimer = window.setTimeout(() => setIsMounted(false), DIALOG_EXIT_DURATION_MS);
    return () => window.clearTimeout(unmountTimer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  return (
    <div
      className={`${isOpen ? "backdrop-enter" : "backdrop-exit"} fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs`}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${isOpen ? "menu-enter" : "menu-exit"} w-full max-w-md rounded-md border border-background-focus bg-background-card p-5 shadow-2xl`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-sm font-medium text-foreground">{props.title}</h2>
            {props.description ? (
              <p className="mt-1 text-xs leading-5 text-foreground-off">{props.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-foreground-off transition-colors hover:bg-background-focus hover:text-foreground">
            <IconX size={15} />
          </button>
        </div>

        <div className="mt-5">{props.children}</div>
      </div>
    </div>
  );
}
