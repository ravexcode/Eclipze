import { IconCheck } from "@tabler/icons-react";

import type { LibrarySkill } from "@/types/agent-runner";

interface Props {
  skills: LibrarySkill[];
  selectedSkillIds: string[];
  onToggle(id: string): void;
}

export default function SkillChips(props: Props) {
  if (props.skills.length === 0) return null;
  const selectedSkillIds = new Set(props.selectedSkillIds);

  return (
    <div role="group" aria-label="Agent skills" className="flex flex-wrap gap-1.5 px-1 pb-2">
      {props.skills.map(skill => {
        const isSelected = selectedSkillIds.has(skill.id);

        return (
          <button
            key={skill.id}
            type="button"
            aria-pressed={isSelected}
            title={skill.description}
            onClick={() => props.onToggle(skill.id)}
            className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs transition-colors ${isSelected ? "bg-accent text-white" : "bg-background-focus text-foreground-off hover:text-foreground"}`}>
            {isSelected ? <IconCheck size={11} strokeWidth={2.5} /> : null}
            {skill.name}
          </button>
        );
      })}
    </div>
  );
}
