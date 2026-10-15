"use client";

import { useEffect, useState } from "react";
import { IconCircleCheckFilled, IconPlug, IconPlus, IconTrash } from "@tabler/icons-react";

import Button from "@/components/ui/button";
import { DEFAULT_MCP_TOOL_NAME } from "@/constants/mcp";
import type { McpConnection } from "@/types/mcp";
import { apiFetch } from "@/utils/api-fetch";
import SettingsFeedback from "./settings-feedback";
import SettingsInput from "./settings-input";
import SettingsRow from "./settings-row";
import SettingsSection from "./settings-section";

type McpResponse = {
  message?: string;
  connections?: McpConnection[];
  connection?: McpConnection;
};

export default function McpSection() {
  const [connections, setConnections] = useState<McpConnection[]>([]);
  const [name, setName] = useState("Codex");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [toolName, setToolName] = useState(DEFAULT_MCP_TOOL_NAME);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void apiFetch("/api/mcp-connections", { cache: "no-store" })
      .then(async response => {
        const data = await response.json() as McpResponse;
        if (cancelled) return;

        if (!response.ok) setError(data.message ?? "Unable to load MCP connections.");
        else setConnections(data.connections ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load MCP connections.");
      });

    return () => { cancelled = true; };
  }, []);

  const connect = async () => {
    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiFetch("/api/mcp-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, token, toolName }),
      });
      const data = await response.json() as McpResponse;

      if (!response.ok || !data.connection) {
        setError(data.message ?? "Unable to connect this MCP server.");
        return;
      }

      const connection = data.connection;
      setConnections(current => [connection, ...current]);
      setMessage(data.message ?? "MCP server connected.");
      setUrl("");
      setToken("");
      setIsFormOpen(false);
    } catch {
      setError("Unable to connect this MCP server.");
    } finally {
      setIsBusy(false);
    }
  };

  const disconnect = async (connection: McpConnection) => {
    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiFetch(`/api/mcp-connections/${connection.id}`, { method: "DELETE" });
      const data = await response.json() as McpResponse;

      if (!response.ok) {
        setError(data.message ?? "Unable to disconnect this MCP server.");
        return;
      }

      setConnections(current => current.filter(item => item.id !== connection.id));
      setMessage(data.message ?? "MCP server disconnected.");
    } catch {
      setError("Unable to disconnect this MCP server.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <SettingsSection
      title="MCP agents"
      description="Connect your own MCP servers and mention them with @tags.">
      <SettingsFeedback error={error} message={message} />

      {connections.map(connection => (
        <SettingsRow
          key={connection.id}
          title={`@${connection.name.replace(/\s+/g, "")}`}
          detail={connection.url}
          leading={<IconPlug size={16} strokeWidth={1.7} />}
          action={(
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-status-green/10 px-2 py-0.5 text-status-green">
                <IconCircleCheckFilled size={12} />
                Connected
              </span>
              <button
                type="button"
                aria-label={`Disconnect ${connection.name}`}
                disabled={isBusy}
                onClick={() => void disconnect(connection)}
                className="rounded-md p-1 text-foreground-off hover:text-alert-red disabled:opacity-50">
                <IconTrash size={14} />
              </button>
            </>
          )} />
      ))}

      <SettingsRow
        title="Add an MCP agent"
        detail="Use Codex with your own login."
        leading={<IconPlus size={16} strokeWidth={1.7} />}
        expanded={isFormOpen}
        controls="mcp-connection-form"
        onClick={() => setIsFormOpen(open => !open)} />

      {isFormOpen ? (
        <form
          id="mcp-connection-form"
          className="flex flex-col gap-4 rounded-lg border border-background-focus bg-background-card p-4"
          onSubmit={event => {
            event.preventDefault();
            void connect();
          }}>
          <p className="text-xs text-foreground-off">
            Run <code>codex mcp-server</code> on your computer, expose it over HTTPS with a
            stdio-to-HTTP proxy and a tunnel, then paste the public URL. Your Codex login never
            leaves your machine.
          </p>
          <label className="flex flex-col gap-1.5 text-xs" htmlFor="mcp-name">
            Agent name (used for @tags)
            <SettingsInput
              id="mcp-name"
              value={name}
              onChange={event => setName(event.target.value)}
              maxLength={40}
              disabled={isBusy}
              required />
          </label>
          <label className="flex flex-col gap-1.5 text-xs" htmlFor="mcp-url">
            Server URL
            <SettingsInput
              id="mcp-url"
              type="url"
              value={url}
              onChange={event => setUrl(event.target.value)}
              placeholder="https://your-tunnel.example.com/mcp"
              autoComplete="off"
              spellCheck={false}
              disabled={isBusy}
              required />
          </label>
          <label className="flex flex-col gap-1.5 text-xs" htmlFor="mcp-token">
            Bearer token <span className="text-foreground-off">Optional, encrypted before storage</span>
            <SettingsInput
              id="mcp-token"
              type="password"
              value={token}
              onChange={event => setToken(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={isBusy} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs" htmlFor="mcp-tool">
            Tool name
            <SettingsInput
              id="mcp-tool"
              value={toolName}
              onChange={event => setToolName(event.target.value)}
              disabled={isBusy}
              required />
          </label>
          <div className="flex justify-end border-t border-background-focus pt-3">
            <Button type="submit" variant="secondary" disabled={isBusy || !name.trim() || !url.trim()}>
              {isBusy ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </form>
      ) : null}
    </SettingsSection>
  );
}
