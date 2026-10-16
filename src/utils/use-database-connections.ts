"use client";

import { useCallback, useEffect, useState } from "react";

import type { DatabaseConnectionSummary, DatabaseProject, DatabaseProvider } from "@/types/database-connections";
import { apiFetch } from "@/utils/api-fetch";
import { errorMessage, readJson } from "@/utils/json-payload";

export function useDatabaseConnections(isEnabled: boolean) {
  const [connections, setConnections] = useState<DatabaseConnectionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/api/database-connections");
      const payload = await readJson(response) as { connections?: DatabaseConnectionSummary[] } | null;

      if (!response.ok) {
        throw new Error(errorMessage(payload, "Unable to load database connections."));
      }

      setConnections(payload?.connections ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load database connections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEnabled) {
      void refresh();
    }
  }, [isEnabled, refresh]);

  // Resolves to an error message, or null when the provider accepted the credential.
  const connect = useCallback(async (input: { provider: DatabaseProvider; credential: string; baseUrl: string }) => {
    try {
      const response = await apiFetch("/api/database-connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await readJson(response) as { connection?: DatabaseConnectionSummary } | null;

      if (!response.ok || !payload?.connection) {
        return errorMessage(payload, "Unable to connect this account.");
      }

      const connection = payload.connection;

      setConnections(current => [
        ...current.filter(item => item.provider !== connection.provider),
        connection,
      ]);
      return null;
    } catch {
      return "Unable to connect this account.";
    }
  }, []);

  const disconnect = useCallback(async (connectionId: string) => {
    try {
      const response = await apiFetch(`/api/database-connections/${encodeURIComponent(connectionId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return errorMessage(await readJson(response), "Unable to disconnect this account.");
      }

      setConnections(current => current.filter(item => item.id !== connectionId));
      return null;
    } catch {
      return "Unable to disconnect this account.";
    }
  }, []);

  return {
    connections,
    loading,
    error,
    refresh,
    connect,
    disconnect,
  };
}

export async function loadDatabaseProjects(connectionId: string) {
  const response = await apiFetch(`/api/database-connections/${encodeURIComponent(connectionId)}/projects`);
  const payload = await readJson(response) as { projects?: DatabaseProject[] } | null;

  if (!response.ok) {
    throw new Error(errorMessage(payload, "Unable to load projects."));
  }

  return payload?.projects ?? [];
}
