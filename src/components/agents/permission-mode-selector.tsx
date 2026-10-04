import { AGENT_PERMISSION_MODE_OPTIONS } from "@/constants/agents";
import type { AgentPermissionMode } from "@/types/agent-runner";

interface Props {
  value: AgentPermissionMode;
  onChange: (value: AgentPermissionMode) => void;
}

export default function PermissionModeSelector({ value, onChange }: Props) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-medium text-foreground">
        Permission mode
      </legend>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {AGENT_PERMISSION_MODE_OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className={`relative flex min-h-20 cursor-pointer flex-col justify-center gap-1 rounded-sm border px-3 py-2.5 transition-colors ${
                selected
                  ? "border-accent bg-accent/10"
                  : "border-background-focus bg-background-card hover:bg-background-focus"
              }`}>
              <input
                type="radio"
                name="agent-permission-mode"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span className="text-xs font-medium text-foreground">
                {option.label}
              </span>
              <span className="text-[10px] leading-4 text-foreground/80">
                {option.description}
              </span>
              <span className="pointer-events-none absolute inset-0 rounded-sm peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background" />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
