"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { IconX } from "@tabler/icons-react";

import { DIALOG_SIZE_CLASSES } from "@/constants/dialog";

interface Props {
  isOpen: boolean;
  title: string;
  description?: string;
  size?: "md" | "lg";
  onClose(): void;
  children: ReactNode;
}

const DIALOG_EXIT_DURATION_MS = 150;

export default function Dialog(props: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const { isOpen, onClose } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pressStartedOnBackdrop = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      return;
    }

    const unmountTimer = window.setTimeout(() => setIsMounted(false), DIALOG_EXIT_DURATION_MS);
    return () => window.clearTimeout(unmountTimer);
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isMounted || !dialog) return;

    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [isMounted]);

  if (!isMounted) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={props.description ? descriptionId : undefined}
      className={`${isOpen ? "backdrop-enter" : "backdrop-exit"} fixed inset-0 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-transparent p-4 backdrop:bg-black/60 backdrop:backdrop-blur-xs`}
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={event => {
        pressStartedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={event => {
        // Close only when the press starts and ends outside the panel, so text selection drags stay open.
        const isBackdropClick = event.target === event.currentTarget && pressStartedOnBackdrop.current;
        pressStartedOnBackdrop.current = false;

        if (isBackdropClick) {
          onClose();
        }
      }}>
      <div
        className={`${isOpen ? "menu-enter" : "menu-exit"} ${DIALOG_SIZE_CLASSES[props.size ?? "md"]} max-h-full w-full overflow-y-auto rounded-md border border-background-focus bg-background-card p-5 shadow-2xl`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-sm font-medium text-foreground">{props.title}</h2>
            {props.description ? (
              <p id={descriptionId} className="mt-1 text-xs leading-5 text-foreground-off">{props.description}</p>
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
    </dialog>
  );
}
