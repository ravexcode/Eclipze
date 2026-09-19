import type { SubmitEvent } from "react";

import type { IssueFormValues } from "@/types/issues";
import type { IssuePriority, IssueType } from "@/types/user";

type IssueFormProps = {
  form: IssueFormValues;
  onChange: (updates: Partial<IssueFormValues>) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export default function IssueForm({
  form,
  onChange,
  onSubmit,
  onCancel,
}: IssueFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-sm bg-background-card p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
        <label className="flex flex-col gap-2 text-sm">
          Title
          <input
            required
            value={form.title}
            onChange={(event) => onChange({ title: event.target.value })}
            className="rounded-sm bg-background-focus px-3 py-2 text-foreground outline-hidden"
            placeholder="What do you need help with?"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          Type
          <select
            value={form.type}
            onChange={(event) =>
              onChange({ type: event.target.value as IssueType })
            }
            className="rounded-sm bg-background-focus px-3 py-2 text-foreground outline-hidden">
            <option value="SUPPORT">Support</option>
            <option value="BUG">Bug</option>
            <option value="FEATURE">Feature</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          Priority
          <select
            value={form.priority}
            onChange={(event) =>
              onChange({ priority: event.target.value as IssuePriority })
            }
            className="rounded-sm bg-background-focus px-3 py-2 text-foreground outline-hidden">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        Description
        <textarea
          required
          minLength={5}
          value={form.description}
          onChange={(event) => onChange({ description: event.target.value })}
          className="min-h-28 resize-y rounded-sm bg-background-focus px-3 py-2 text-foreground outline-hidden"
          placeholder="Describe the issue with enough context for the team."
        />
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm px-3 py-2 text-sm text-foreground-off hover:bg-background-focus">
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-sm bg-accent px-3 py-2 text-sm hover:brightness-125">
          Submit issue
        </button>
      </div>
    </form>
  );
}
