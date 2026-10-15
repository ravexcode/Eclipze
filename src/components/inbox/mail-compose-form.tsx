import type { FormEvent } from "react";

import Input from "@/components/ui/input";
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
          <Input
            value={values.to}
            onChange={to => onChange({ to })}
            maxLength={255}
            autoComplete="off"
            placeholder="Username or email address"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-xs text-foreground-off">
          Subject
          <Input
            value={values.subject}
            onChange={subject => onChange({ subject })}
            maxLength={200}
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-xs text-foreground-off">
          Message
          <Input
            type="textarea"
            value={values.body}
            onChange={body => onChange({ body })}
            maxLength={20000}
            rows={8}
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
