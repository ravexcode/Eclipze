import Input from "@/components/ui/input";
import MenuSelector from "@/components/ui/menu-selector";
import { ISSUE_STATUS_FILTER_OPTIONS, ISSUE_TYPE_FILTER_OPTIONS } from "@/constants/issues";
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
    <section className="flex flex-wrap gap-2 rounded-md bg-background-card p-3">
      <Input
        type="search"
        aria-label="Search issues"
        value={query}
        onChange={onQueryChange}
        className="min-w-56 flex-1"
        placeholder="Search issues"
      />

      <MenuSelector
        ariaLabel="Filter issues by status"
        value={status}
        onChange={onStatusChange}
        options={ISSUE_STATUS_FILTER_OPTIONS}
        placeholder="All statuses"
        className="w-44"
      />

      <MenuSelector
        ariaLabel="Filter issues by type"
        value={type}
        onChange={onTypeChange}
        options={ISSUE_TYPE_FILTER_OPTIONS}
        placeholder="All types"
        className="w-36"
      />
    </section>
  );
}
