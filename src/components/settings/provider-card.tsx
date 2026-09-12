"use client";

import {
  IconCircleCheck,
  IconKey,
  IconLink,
  IconTrash,
} from "@tabler/icons-react";

import Button from "@/components/ui/button";
import type {
  AiProvider,
  AiProviderConfig,
  AiProviderConnection,
} from "@/types/ai";
import SettingsInput from "./settings-input";

export default function ProviderCard(props: {
  provider: AiProviderConfig;
  connection?: AiProviderConnection;
  apiKey: string;
  isBusy: boolean;
  onApiKeyChange(provider: AiProvider, value: string): void;
  onConnect(provider: AiProviderConfig): void;
  onDisconnect(provider: AiProviderConfig): void;
}) {
  const isConnected = Boolean(props.connection?.connected);
  const isApiKeyProvider = props.provider.kind === "api-key";
  const canConnect = !isApiKeyProvider || Boolean(props.apiKey.trim());

  return (
    <article className="flex flex-col gap-4 rounded-sm bg-background-focus/40 p-4 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-background-focus text-foreground-off">
            {isApiKeyProvider ? <IconKey size={17} /> : <IconLink size={17} />}
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium">{props.provider.label}</p>
            <p className="text-xs leading-5 text-foreground-off">
              {props.provider.description}
            </p>
          </div>
        </div>
        {isConnected ? (
          <span className="flex shrink-0 items-center gap-1 text-xs text-green-400">
            <IconCircleCheck size={14} />
            Connected
          </span>
        ) : null}
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          props.onConnect(props.provider);
        }}
      >
        {isApiKeyProvider ? (
          <label
            className="flex flex-col gap-1.5 text-sm"
            htmlFor={`${props.provider.id}-api-key`}
          >
            API key
            <SettingsInput
              id={`${props.provider.id}-api-key`}
              type="password"
              value={props.apiKey}
              onChange={(event) =>
                props.onApiKeyChange(props.provider.id, event.target.value)
              }
              placeholder={
                isConnected
                  ? "Enter new key to replace saved key"
                  : "Paste API key"
              }
              autoComplete="off"
              disabled={props.isBusy}
              spellCheck={false}
            />
            <span className="text-xs text-foreground-off">
              {isConnected && props.connection?.keyHint ? (
                `Saved key ends in ${props.connection.keyHint}. Enter a new key to replace it.`
              ) : props.provider.id === "GPT" ? (
                <>
                  <a
                    className="underline hover:text-foreground"
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Create an OpenAI API key
                  </a>{" "}
                  to connect your account. ChatGPT subscriptions are billed
                  separately.
                </>
              ) : (
                "Key is encrypted before storage."
              )}
            </span>
          </label>
        ) : null}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isConnected ? (
            <Button
              type="button"
              variant="ghost"
              className="text-red-400 hover:text-red-300"
              onClick={() => props.onDisconnect(props.provider)}
              disabled={props.isBusy}
            >
              <IconTrash size={15} className="mr-1.5" />
              Disconnect
            </Button>
          ) : null}
          {!isConnected || isApiKeyProvider ? (
            <Button
              type="submit"
              variant="secondary"
              disabled={props.isBusy || !canConnect}
            >
              {props.isBusy
                ? "Saving..."
                : isConnected
                  ? "Replace key"
                  : "Connect"}
            </Button>
          ) : null}
        </div>
      </form>
    </article>
  );
}
