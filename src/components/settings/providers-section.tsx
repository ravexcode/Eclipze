"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AI_PROVIDERS,
  type AiProvider,
  type AiProviderConfig,
  type AiProviderConnection,
} from "@/types/ai";
import { apiFetch } from "@/utils/api-fetch";
import ProviderCard from "./provider-card";
import SettingsFeedback from "./settings-feedback";

type ConnectionResponse = {
  message: string;
  connection?: AiProviderConnection;
};

const initialApiKeys = AI_PROVIDERS.reduce(
  (keys, provider) => {
    keys[provider.id] = "";
    return keys;
  },
  {} as Record<AiProvider, string>,
);

const initialModels = AI_PROVIDERS.reduce(
  (models, provider) => {
    models[provider.id] = "";
    return models;
  },
  {} as Record<AiProvider, string>,
);

export default function ProvidersSection() {
  const [connections, setConnections] = useState<AiProviderConnection[]>([]);
  const [apiKeys, setApiKeys] =
    useState<Record<AiProvider, string>>(initialApiKeys);
  const [models, setModels] = useState<Record<AiProvider, string>>(initialModels);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<AiProvider | null>(null);

  useEffect(() => {
    let cancelled = false;
    void apiFetch("/api/ai-providers", {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          message?: string;
          connections?: AiProviderConnection[];
        };
        if (cancelled) return;
        if (!response.ok)
          setError(data.message ?? "Unable to load AI providers.");
        else {
          setConnections(data.connections ?? []);
          setModels((current) => ({
            ...current,
            ...(data.connections ?? []).reduce((values, connection) => {
              values[connection.provider] = connection.model ?? "";
              return values;
            }, {} as Record<AiProvider, string>),
          }));
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load AI providers.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const connectionMap = useMemo(
    () =>
      new Map(
        connections.map((connection) => [connection.provider, connection]),
      ),
    [connections],
  );

  const onConnect = async (provider: AiProviderConfig) => {
    setError(null);
    setMessage(null);
    setBusyProvider(provider.id);
    try {
      const body: { provider: AiProvider; apiKey?: string; model?: string } = {
        provider: provider.id,
        model: models[provider.id],
      };
      if (provider.kind === "api-key") body.apiKey = apiKeys[provider.id];
      const response = await apiFetch("/api/ai-providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as ConnectionResponse;
      if (!response.ok) {
        setError(data.message);
        return;
      }
      if (data.connection)
        setConnections((current) => [
          ...current.filter((item) => item.provider !== provider.id),
          data.connection!,
        ]);
      setApiKeys((current) => ({ ...current, [provider.id]: "" }));
      setModels((current) => ({ ...current, [provider.id]: data.connection?.model ?? current[provider.id] }));
      setMessage(data.message);
    } catch {
      setError(`Unable to connect ${provider.label}.`);
    } finally {
      setBusyProvider(null);
    }
  };

  const onDisconnect = async (provider: AiProviderConfig) => {
    if (!window.confirm(`Disconnect ${provider.label}?`)) return;
    setError(null);
    setMessage(null);
    setBusyProvider(provider.id);
    try {
      const response = await apiFetch("/api/ai-providers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider: provider.id }),
      });
      const data = (await response.json()) as ConnectionResponse;
      if (!response.ok) {
        setError(data.message);
        return;
      }
      setConnections((current) =>
        current.filter((item) => item.provider !== provider.id),
      );
      setMessage(data.message);
    } catch {
      setError(`Unable to disconnect ${provider.label}.`);
    } finally {
      setBusyProvider(null);
    }
  };

  const connectionProviders = AI_PROVIDERS.filter(
    (provider) => provider.id === "GPT" || provider.id === "CLAUDE" || provider.id === "XAI",
  );
  const apiKeyProviders = AI_PROVIDERS.filter(
    (provider) => provider.id === "OPENROUTER" || provider.id === "ZAI",
  );

  const renderProviderRows = (providers: readonly AiProviderConfig[]) => (
    isLoading ? (
      <div className="flex flex-col gap-2" role="status" aria-label="Loading provider connections">
        {providers.map((provider) => (
          <div key={provider.id} className="flex h-10 items-center justify-between rounded-sm bg-background-card px-2.5" aria-hidden="true">
            <span className="h-3.5 w-28 animate-pulse rounded-sm bg-background-focus" />
            <span className="h-3 w-16 animate-pulse rounded-sm bg-background-focus" />
          </div>
        ))}
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            connection={connectionMap.get(provider.id)}
            apiKey={apiKeys[provider.id]}
            model={models[provider.id]}
            isBusy={busyProvider === provider.id}
            onApiKeyChange={(id, value) =>
              setApiKeys((current) => ({ ...current, [id]: value }))
            }
            onModelChange={(id, value) =>
              setModels((current) => ({ ...current, [id]: value }))
            }
            onConnect={onConnect}
            onDisconnect={onDisconnect} />
        ))}
      </div>
    )
  );

  return (
    <div className="flex flex-col gap-7">
      <SettingsFeedback error={error} message={message} />
      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-medium">AI Connections</h2>
        {renderProviderRows(connectionProviders)}
      </section>
      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-medium">API Keys</h2>
        {renderProviderRows(apiKeyProviders)}
      </section>
    </div>
  );
}
