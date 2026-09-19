import { IconSearch } from "@tabler/icons-react";

import { statusLabels, typeLabels } from "@/constants/issues";
import type { IssueStatus, IssueType } from "@/types/user";

type IssueFiltersProps = {
  query: string;
  status: "ALL" | IssueStatus;
  type: "ALL" | IssueType;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: "ALL" | IssueStatus) => void;
  onTypeChange: (type: "ALL" | IssueType) => void;
};

export default function IssueFilters({
  query,
  status,
  type,
  onQueryChange,
  onStatusChange,
  onTypeChange,
}: IssueFiltersProps) {
  return (
    <section className="flex flex-wrap gap-2 rounded-sm bg-background-card p-3">
      <label className="flex min-w-56 flex-1 items-center gap-2 rounded-sm bg-background-focus px-3 py-2 text-sm text-foreground-off">
        <IconSearch size={16} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="w-full bg-transparent text-foreground outline-hidden"
          placeholder="Search issues"
        />
      </label>

      <select
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as "ALL" | IssueStatus)
        }
        className="rounded-sm bg-background-focus px-3 py-2 text-sm text-foreground outline-hidden">
        <option value="ALL">All statuses</option>
        {Object.keys(statusLabels).map((value) => (
          <option key={value} value={value}>
            {statusLabels[value as IssueStatus]}
          </option>
        ))}
      </select>

      <select
        value={type}
        onChange={(event) =>
          onTypeChange(event.target.value as "ALL" | IssueType)
        }
        className="rounded-sm bg-background-focus px-3 py-2 text-sm text-foreground outline-hidden">
        <option value="ALL">All types</option>
        {Object.keys(typeLabels).map((value) => (
          <option key={value} value={value}>
            {typeLabels[value as IssueType]}
          </option>
        ))}
      </select>
    </section>
  );
}
