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
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 sm:p-8">
        <div>
          <h1 className="text-[22px] font-medium">New message</h1>
          <p className="mt-1 text-[14px] text-foreground-off">Send a message to another verified Eclipze user.</p>
        </div>

        {error ? <p role="alert" className="text-[14px] text-alert-red">{error}</p> : null}

        <label className="flex flex-col gap-2 text-[14px] text-foreground-off">
          To
          <input
            value={values.to}
            onChange={event => onChange({ to: event.target.value })}
            maxLength={255}
            autoComplete="off"
            placeholder="Username or email address"
            className="h-11 rounded-xs border border-background-focus bg-background-card px-3 text-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-[14px] text-foreground-off">
          Subject
          <input
            value={values.subject}
            onChange={event => onChange({ subject: event.target.value })}
            maxLength={200}
            className="h-11 rounded-xs border border-background-focus bg-background-card px-3 text-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
            required
          />
        </label>

        <label className="flex min-h-48 flex-1 flex-col gap-2 text-[14px] text-foreground-off">
          Message
          <textarea
            value={values.body}
            onChange={event => onChange({ body: event.target.value })}
            maxLength={20000}
            className="min-h-48 flex-1 resize-y rounded-xs border border-background-focus bg-background-card p-3 text-[15px] leading-6 text-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
            required
          />
          <span className="text-right text-[12px]">{values.body.length}/20,000</span>
        </label>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-background-focus p-4 sm:px-8">
        <button type="button" onClick={onCancel} className="rounded-xs px-4 py-2 text-[14px] text-foreground-off hover:bg-background-focus hover:text-foreground">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="rounded-xs bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
