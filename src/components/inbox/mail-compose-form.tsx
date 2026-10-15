import type { FormEvent } from "react";

import type { MailFormValues } from "@/types/mail";

type MailComposeFormProps = {
  values: MailFormValues;
  busy: boolean;
  error: string | null;
  onChange: (updates: Partial<MailFormValues>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export default function MailComposeForm({
  values,
  busy,
  error,
  onChange,
  onSubmit,
  onCancel,
}: MailComposeFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-5">
        {error ? <p role="alert" className="text-xs text-alert-red">{error}</p> : null}

        <label className="flex flex-col gap-2 text-xs text-foreground-off">
          To
          <input
            value={values.to}
            onChange={event => onChange({ to: event.target.value })}
            maxLength={255}
            autoComplete="off"
            placeholder="Username or email address"
            className="h-11 rounded-md border border-background-focus bg-background-card px-3 text-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-xs text-foreground-off">
          Subject
          <input
            value={values.subject}
            onChange={event => onChange({ subject: event.target.value })}
            maxLength={200}
            className="h-11 rounded-md border border-background-focus bg-background-card px-3 text-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-xs text-foreground-off">
          Message
          <textarea
            value={values.body}
            onChange={event => onChange({ body: event.target.value })}
            maxLength={20000}
            className="min-h-48 resize-y rounded-md border border-background-focus bg-background-card p-3 text-xs leading-6 text-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
            required
          />
          <span className="text-right text-xs">{values.body.length}/20,000</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-2.5">
        <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-xs text-foreground-off hover:bg-background-focus hover:text-foreground">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
