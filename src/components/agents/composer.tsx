"use client";

import { IconArrowUp, IconMicrophone, IconPlayerStopFilled } from "@tabler/icons-react";

import { useState } from "react";

import AgentMentionMenu from "@/components/agents/mention-menu";
import SessionSelector from "@/components/agents/session-selector";
import SkillChips from "@/components/agents/skill-chips";
import type { LibrarySkill } from "@/types/agent-runner";
import {
  filterMentionableAgents,
  getMentionQuery,
  insertAgentMention,
  type MentionableAgent,
} from "@/utils/agents/mentions";
import { useSpeechRecognition } from "@/utils/agents/use-speech-recognition";

interface Props {
  id: string;
  value: string;
  placeholder: string;
  isSendDisabled: boolean;
  currentRunId?: string;
  skills?: LibrarySkill[];
  selectedSkillIds?: string[];
  agents?: MentionableAgent[];
  onChange(value: string): void;
  onSend(): void;
  onSelectSession(runId: string): void;
  onToggleSkill?(id: string): void;
}

export default function AgentComposer(props: Props) {
  const speech = useSpeechRecognition(text => {
    const separator = props.value && !props.value.endsWith(" ") ? " " : "";
    props.onChange(`${props.value}${separator}${text}`);
  });

  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const mentionQuery = getMentionQuery(props.value);
  const mentionMatches = mentionQuery === null
    ? []
    : filterMentionableAgents(props.agents ?? [], mentionQuery);
  const isMentionMenuOpen = mentionMatches.length > 0;
  const isDictationMode = speech.isSupported && (speech.isListening || !props.value.trim());
  const activeIndex = Math.min(highlightedIndex, Math.max(mentionMatches.length - 1, 0));

  const selectMention = (agent: MentionableAgent) => {
    props.onChange(insertAgentMention(props.value, agent));
    setHighlightedIndex(0);
  };

  return (
    <div className="relative rounded-md bg-background-card p-2.5 sm:p-3">
      {isMentionMenuOpen ? (
        <AgentMentionMenu
          agents={mentionMatches}
          highlightedIndex={activeIndex}
          onSelect={selectMention} />
      ) : null}

      {props.skills && props.onToggleSkill ? (
        <SkillChips
          skills={props.skills}
          selectedSkillIds={props.selectedSkillIds ?? []}
          onToggle={props.onToggleSkill} />
      ) : null}

      <label htmlFor={props.id} className="sr-only">{props.placeholder}</label>
      <textarea
        id={props.id}
        rows={1}
        value={props.value}
        onChange={event => props.onChange(event.target.value)}
        onKeyDown={event => {
          if (isMentionMenuOpen) {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const step = event.key === "ArrowDown" ? 1 : -1;
              setHighlightedIndex((activeIndex + step + mentionMatches.length) % mentionMatches.length);
              return;
            }

            if (event.key === "Enter" || event.key === "Tab") {
              event.preventDefault();
              selectMention(mentionMatches[activeIndex]);
              return;
            }
          }

          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!props.isSendDisabled) props.onSend();
          }
        }}
        placeholder={props.placeholder}
        className="field-sizing-content max-h-48 min-h-12 w-full resize-none bg-transparent px-1.5 py-1 text-xs leading-6 outline-hidden placeholder:text-foreground-off" />

      <div className="flex items-center justify-between pt-2">
        <SessionSelector currentRunId={props.currentRunId} onSelect={props.onSelectSession} />

        {isDictationMode ? (
          <button
            type="button"
            onClick={speech.toggle}
            aria-pressed={speech.isListening}
            aria-label={speech.isListening ? "Stop dictation" : "Start dictation"}
            className={`flex size-7 shrink-0 items-center justify-center rounded-full text-white transition-colors ${speech.isListening ? "animate-pulse bg-priority-high" : "bg-accent hover:bg-accent-strong"}`}>
            {speech.isListening ? <IconPlayerStopFilled size={13} /> : <IconMicrophone size={15} />}
          </button>
        ) : (
          <button
            type="button"
            onClick={props.onSend}
            disabled={props.isSendDisabled}
            aria-label="Send"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40">
            <IconArrowUp size={15} strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  );
}
