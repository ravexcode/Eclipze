import type { SubmitEvent } from "react";

import Input from "@/components/ui/input";
import MenuSelector from "@/components/ui/menu-selector";
import { ISSUE_PRIORITY_OPTIONS, ISSUE_TYPE_OPTIONS } from "@/constants/issues";
import type { IssueFormValues } from "@/types/issues";

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
        <Input
          required
          value={form.title}
          onChange={(title) => onChange({ title })}
          placeholder="What do you need help with?"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 text-xs">
          <p>Type</p>
          <MenuSelector
            ariaLabel="Type"
            value={form.type}
            onChange={(type) => onChange({ type })}
            options={ISSUE_TYPE_OPTIONS}
            placeholder="Select a type"
          />
        </div>

        <div className="flex flex-col gap-2 text-xs">
          <p>Priority</p>
          <MenuSelector
            ariaLabel="Priority"
            value={form.priority}
            onChange={(priority) => onChange({ priority })}
            options={ISSUE_PRIORITY_OPTIONS}
            placeholder="Select a priority"
          />
        </div>
      </div>

      <label className="flex flex-col gap-2 text-xs">
        Description
        <Input
          type="textarea"
          required
          minLength={5}
          value={form.description}
          onChange={(description) => onChange({ description })}
          rows={5}
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
