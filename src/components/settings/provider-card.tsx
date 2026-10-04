"use client";

import { useState } from "react";
import {
  IconCircleCheck,
  IconExternalLink,
  IconTrash,
} from "@tabler/icons-react";

import Button from "@/components/ui/button";
import type {
  AiProvider,
  AiProviderConfig,
  AiProviderConnection,
} from "@/types/ai";
import SettingsInput from "./settings-input";
import SettingsRow from "./settings-row";

export default function ProviderCard(props: {
  provider: AiProviderConfig;
  connection?: AiProviderConnection;
  apiKey: string;
  model: string;
  isBusy: boolean;
  onApiKeyChange(provider: AiProvider, value: string): void;
  onModelChange(provider: AiProvider, value: string): void;
  onConnect(provider: AiProviderConfig): void;
  onDisconnect(provider: AiProviderConfig): void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isConnected = Boolean(props.connection?.connected);
  const isApiKeyProvider = props.provider.kind === "api-key";
  const canConnect = !isApiKeyProvider || Boolean(props.apiKey.trim());
  const panelId = `${props.provider.id.toLowerCase()}-provider-settings`;
  const mark = props.provider.id === "OPENROUTER"
    ? "R"
    : props.provider.id === "CLAUDE"
      ? "C"
      : props.provider.id === "GPT"
        ? "O"
        : props.provider.label.slice(0, 1);

  return (
    <article className="flex flex-col gap-1">
      <SettingsRow
        title={props.provider.label}
        leading={<span className="text-[11px] font-semibold">{mark}</span>}
        action={isConnected ? (
          <span className="inline-flex items-center gap-1 text-status-green">
            <IconCircleCheck size={13} />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-foreground-off">
            Connect
            <IconExternalLink size={13} strokeWidth={1.6} />
          </span>
        )}
        expanded={isOpen}
        controls={panelId}
        onClick={() => setIsOpen((open) => !open)} />
      {isOpen ? (
        <form
          id={panelId}
          className="flex flex-col gap-3 rounded-sm bg-background-card px-3 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            props.onConnect(props.provider);
          }}>
          <div>
            <p className="text-sm font-medium">{props.provider.label}</p>
            <p className="mt-1 text-xs text-foreground-off">{props.provider.description}</p>
          </div>
          {isApiKeyProvider ? (
            <label
              className="flex flex-col gap-1.5 text-sm"
              htmlFor={`${props.provider.id}-api-key`}>
              API key
              <SettingsInput
                id={`${props.provider.id}-api-key`}
                type="password"
                value={props.apiKey}
                onChange={(event) => props.onApiKeyChange(props.provider.id, event.target.value)}
                placeholder={isConnected ? "Enter new key to replace saved key" : "Paste API key"}
                autoComplete="off"
                disabled={props.isBusy}
                spellCheck={false} />
              <span className="text-xs text-foreground-off">
                {isConnected && props.connection?.keyHint ? (
                  `Saved key ends in ${props.connection.keyHint}. Enter a new key to replace it.`
                ) : props.provider.id === "GPT" ? (
                  <>
                    <a
                      className="underline hover:text-foreground"
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer">
                      Create an OpenAI API key
                    </a>{" "}
                    to connect your account. ChatGPT subscriptions are billed separately.
                  </>
                ) : (
                  "Key is encrypted before storage."
                )}
              </span>
            </label>
          ) : null}
          <label className="flex flex-col gap-1.5 text-sm" htmlFor={`${props.provider.id}-model`}>
            Model override <span className="text-xs text-foreground-off">Optional</span>
            <SettingsInput
              id={`${props.provider.id}-model`}
              type="text"
              value={props.model}
              onChange={(event) => props.onModelChange(props.provider.id, event.target.value)}
              placeholder="Use the default model"
              autoComplete="off"
              disabled={props.isBusy} />
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isConnected ? (
              <Button
                type="button"
                variant="ghost"
                className="text-alert-red hover:text-alert-red"
                onClick={() => props.onDisconnect(props.provider)}
                disabled={props.isBusy}>
                <IconTrash size={15} className="mr-1.5" />
                Disconnect
              </Button>
            ) : null}
            {!isConnected || isApiKeyProvider ? (
              <Button type="submit" variant="secondary" disabled={props.isBusy || !canConnect}>
                {props.isBusy ? "Saving..." : isConnected ? "Replace key" : "Connect"}
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
    </article>
  );
}
