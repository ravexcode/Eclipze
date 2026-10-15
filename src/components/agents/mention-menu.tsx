import { getAgentHandle, type MentionableAgent } from "@/utils/agents/mentions";

interface Props {
  agents: MentionableAgent[];
  highlightedIndex: number;
  onSelect(agent: MentionableAgent): void;
}

export default function AgentMentionMenu(props: Props) {
  return (
    <div
      role="listbox"
      aria-label="Tag an agent"
      className="absolute bottom-full left-0 z-10 mb-2 w-56 overflow-hidden rounded-md border border-background-focus bg-background-card py-1">
      {props.agents.map((agent, index) => (
        <button
          key={agent.id}
          role="option"
          type="button"
          aria-selected={index === props.highlightedIndex}
          onMouseDown={event => {
            event.preventDefault();
            props.onSelect(agent);
          }}
          className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-background-focus ${index === props.highlightedIndex ? "bg-background-focus" : ""}`}>
          <span>@{getAgentHandle(agent.name)}</span>
          <span className="truncate text-foreground-off">{agent.defaultModel}</span>
        </button>
      ))}
    </div>
  );
}
