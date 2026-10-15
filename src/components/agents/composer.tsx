"use client";

import { IconArrowUp, IconMicrophone, IconPlayerStopFilled } from "@tabler/icons-react";

import SessionSelector from "@/components/agents/session-selector";
import SkillChips from "@/components/agents/skill-chips";
import type { LibrarySkill } from "@/types/agent-runner";
import { useSpeechRecognition } from "@/utils/agents/use-speech-recognition";

interface Props {
  id: string;
  value: string;
  placeholder: string;
  isSendDisabled: boolean;
  currentRunId?: string;
  skills?: LibrarySkill[];
  selectedSkillIds?: string[];
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

  return (
    <div className="rounded-md bg-background-card p-2.5 sm:p-3">
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
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!props.isSendDisabled) props.onSend();
          }
        }}
        placeholder={props.placeholder}
        className="field-sizing-content max-h-48 min-h-12 w-full resize-none bg-transparent px-1.5 py-1 text-xs leading-6 outline-hidden placeholder:text-foreground-off" />

      <div className="flex items-center justify-between pt-2">
        <SessionSelector currentRunId={props.currentRunId} onSelect={props.onSelectSession} />

        <div className="flex items-center gap-1.5">
          {speech.isSupported ? (
            <button
              type="button"
              onClick={speech.toggle}
              aria-pressed={speech.isListening}
              aria-label={speech.isListening ? "Stop dictation" : "Start dictation"}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${speech.isListening ? "animate-pulse bg-priority-high text-white" : "text-foreground-off hover:bg-background-focus hover:text-foreground"}`}>
              {speech.isListening ? <IconPlayerStopFilled size={13} /> : <IconMicrophone size={15} />}
            </button>
          ) : null}

          <button
            type="button"
            onClick={props.onSend}
            disabled={props.isSendDisabled}
            aria-label="Send"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40">
            <IconArrowUp size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}
