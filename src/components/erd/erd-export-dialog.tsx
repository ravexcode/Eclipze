"use client";

import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";

import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import {
  ERD_COPY_FEEDBACK_MS,
  ERD_EXPORT_FORMAT_LABELS,
  ERD_EXPORT_FORMATS,
} from "@/constants/erd";
import type { ErdDocument, ErdExportFormat } from "@/types/erd";
import { exportErdToPrisma, exportErdToSql } from "@/utils/erd";

interface Props {
  isOpen: boolean;
  projectName: string;
  document: ErdDocument;
  onClose(): void;
}

export default function ErdExportDialog(props: Props) {
  const [format, setFormat] = useState<ErdExportFormat>("prisma");
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => (
    format === "prisma"
      ? exportErdToPrisma(props.document)
      : exportErdToSql(props.document)
  ), [format, props.document]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const resetTimer = window.setTimeout(() => setCopied(false), ERD_COPY_FEEDBACK_MS);
    return () => window.clearTimeout(resetTimer);
  }, [copied]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      title="Export diagram"
      description={`Generate a schema for ${props.projectName} from the current diagram.`}
      size="lg"
      onClose={props.onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Export format"
            className="flex rounded-md border border-background-focus bg-background p-0.5">
            {ERD_EXPORT_FORMATS.map(exportFormat => (
              <button
                key={exportFormat}
                type="button"
                role="tab"
                aria-selected={format === exportFormat}
                onClick={() => setFormat(exportFormat)}
                className={`rounded-sm px-3 py-1 text-xs transition-colors duration-200 ${format === exportFormat
                  ? "bg-background-focus text-foreground"
                  : "text-foreground-off hover:text-foreground"
                  }`}>
                {ERD_EXPORT_FORMAT_LABELS[exportFormat]}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            onClick={() => void copyCode()}
            disabled={!code}>
            {copied ? (
              <IconCheck size={13} strokeWidth={1.8} className="mr-1 text-status-green" />
            ) : (
              <IconCopy size={13} strokeWidth={1.8} className="mr-1" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        {code ? (
          <pre
            data-lenis-prevent
            className="max-h-96 overflow-auto rounded-md border border-background-focus bg-background p-4 font-mono text-xs leading-5 text-foreground">
            <code>{code}</code>
          </pre>
        ) : (
          <p className="rounded-md border border-dashed border-background-focus px-4 py-8 text-center text-xs text-foreground-off">
            Add a table to generate a schema.
          </p>
        )}
      </div>
    </Dialog>
  );
}
