import type { SubmitEvent } from "react";

import type { IssueFormValues } from "@/types/issues";
import type { IssuePriority, IssueType } from "@/types/user";

type IssueFormProps = {
  form: IssueFormValues;
  error: string | null;
  onChange: (updates: Partial<IssueFormValues>) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export default function IssueForm({
  form,
  error,
  onChange,
  onSubmit,
  onCancel,
}: IssueFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4">
      {error ? (
        <p
          role="alert"
          className="text-xs text-alert-red">
          {error}
        </p>
      ) : null}

      <label className="flex flex-col gap-2 text-xs">
        Title
        <input
          required
          value={form.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="rounded-md bg-background-focus px-3 py-1.5 text-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
          placeholder="What do you need help with?"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs">
          Type
          <select
            value={form.type}
            onChange={(event) =>
              onChange({ type: event.target.value as IssueType })
            }
            className="rounded-md bg-background-focus px-3 py-1.5 text-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
            <option value="SUPPORT">Support</option>
            <option value="BUG">Bug</option>
            <option value="FEATURE">Feature</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-xs">
          Priority
          <select
            value={form.priority}
            onChange={(event) =>
              onChange({ priority: event.target.value as IssuePriority })
            }
            className="rounded-md bg-background-focus px-3 py-1.5 text-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-accent">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-xs">
        Description
        <textarea
          required
          minLength={5}
          value={form.description}
          onChange={(event) => onChange({ description: event.target.value })}
          className="min-h-28 resize-y rounded-md bg-background-focus px-3 py-1.5 text-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
          placeholder="Describe the issue with enough context for the team."
        />
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs text-foreground-off hover:bg-background-focus">
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-1.5 text-xs hover:brightness-125">
          Submit issue
        </button>
      </div>
    </form>
  );
}
