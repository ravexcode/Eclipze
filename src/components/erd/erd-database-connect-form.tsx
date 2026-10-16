"use client";

import { useState, type FormEvent } from "react";
import { IconExternalLink } from "@tabler/icons-react";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import type { DatabaseProvider, DatabaseProviderConfig } from "@/types/database-connections";

interface Props {
  provider: DatabaseProviderConfig;
  onConnect(input: { provider: DatabaseProvider; credential: string; baseUrl: string }): Promise<string | null>;
  onCancel(): void;
}

export default function ErdDatabaseConnectForm(props: Props) {
  const [credential, setCredential] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(credential.trim()) && (!props.provider.needsBaseUrl || Boolean(baseUrl.trim()));

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canSubmit || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    const connectError = await props.onConnect({
      provider: props.provider.id,
      credential,
      baseUrl,
    });

    setIsConnecting(false);

    if (connectError) {
      setError(connectError);
      return;
    }

    props.onCancel();
  };

  return (
    <form
      onSubmit={event => void submit(event)}
      className="mt-3 flex flex-col gap-2">
      {props.provider.needsBaseUrl ? (
        <>
          <label
            htmlFor={`database-url-${props.provider.id}`}
            className="text-xs text-foreground-off">
            Project URL
          </label>
          <Input
            id={`database-url-${props.provider.id}`}
            type="url"
            value={baseUrl}
            onChange={setBaseUrl}
            placeholder="https://your-project.insforge.app"
            autoComplete="off"
            spellCheck={false} />
        </>
      ) : null}

      <label
        htmlFor={`database-credential-${props.provider.id}`}
        className="text-xs text-foreground-off">
        {props.provider.credentialLabel}
      </label>
      <Input
        id={`database-credential-${props.provider.id}`}
        type="password"
        value={credential}
        onChange={setCredential}
        placeholder={props.provider.credentialPlaceholder}
        autoComplete="off"
        spellCheck={false} />

      <p className="text-xs leading-5 text-foreground-off">
        {props.provider.credentialHelp}{" "}
        <a
          href={props.provider.credentialHelpUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 text-foreground underline underline-offset-2">
          Open {props.provider.label}
          <IconExternalLink size={11} strokeWidth={1.8} />
        </a>
      </p>

      {error ? (
        <p
          role="alert"
          className="text-xs text-alert-red">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          onClick={props.onCancel}
          disabled={isConnecting}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!canSubmit || isConnecting}>
          {isConnecting ? "Verifying…" : "Connect"}
        </Button>
      </div>
    </form>
  );
}
