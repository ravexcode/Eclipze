"use client";

import { AGENT_PERMISSION_MODE_OPTIONS } from "@/constants/agents";
import MenuSelector from "@/components/ui/menu-selector";
import type { AgentPermissionMode } from "@/types/agent-runner";

interface Props {
  value: AgentPermissionMode;
  onChange: (value: AgentPermissionMode) => void;
}

export default function PermissionModeSelector({ value, onChange }: Props) {
  return (
    <MenuSelector
      ariaLabel="Permission mode"
      className="w-44 shrink-0"
      onChange={onChange}
      options={AGENT_PERMISSION_MODE_OPTIONS}
      placeholder="Select a mode"
      value={value}
    />
  );
}
