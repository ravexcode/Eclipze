"use client";

import { useState } from "react";
import {
  IconCircleCheckFilled,
  IconTrash,
} from "@tabler/icons-react";

import Button from "@/components/ui/button";
import ProviderIcon from "@/components/ui/provider-icon";
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
  const connectionDetail = isConnected && props.connection?.keyHint
    ? `Key ending in ${props.connection.keyHint}`
    : props.provider.description;

  return (
    <article className="flex flex-col gap-1">
      <SettingsRow
        title={props.provider.label}
        detail={connectionDetail}
        leading={(
          <ProviderIcon
            provider={props.provider.id}
            size={16} />
        )}
        action={isConnected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-status-green/10 px-2 py-0.5 text-status-green">
            <IconCircleCheckFilled size={12} />
            Connected
          </span>
        ) : (
          <span className="text-foreground-off">
            Not connected
          </span>
        )}
        expanded={isOpen}
        controls={panelId}
        onClick={() => setIsOpen((open) => !open)} />
      {isOpen ? (
        <form
          id={panelId}
          className="flex flex-col gap-4 rounded-lg border border-background-focus bg-background-card p-4"
          onSubmit={(event) => {
            event.preventDefault();
            props.onConnect(props.provider);
          }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-background-focus bg-background text-foreground">
              <ProviderIcon
                provider={props.provider.id}
                size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{props.provider.label}</p>
              <p className="mt-0.5 text-xs text-foreground-off">{props.provider.description}</p>
            </div>
          </div>
          {isApiKeyProvider ? (
            <label
              className="flex flex-col gap-1.5 text-xs"
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
          <label className="flex flex-col gap-1.5 text-xs" htmlFor={`${props.provider.id}-model`}>
            Model override <span className="text-foreground-off">(optional)</span>
            <SettingsInput
              id={`${props.provider.id}-model`}
              type="text"
              value={props.model}
              onChange={(event) => props.onModelChange(props.provider.id, event.target.value)}
              placeholder="Use the default model"
              autoComplete="off"
              disabled={props.isBusy} />
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-background-focus pt-3">
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
