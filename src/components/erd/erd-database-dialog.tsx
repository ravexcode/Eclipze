"use client";

import { useState } from "react";

import ErdDatabaseConnectForm from "@/components/erd/erd-database-connect-form";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import { DATABASE_PROVIDERS } from "@/constants/database-connections";
import type { DatabaseConnectionSummary, DatabaseProvider } from "@/types/database-connections";

interface Props {
  isOpen: boolean;
  connections: DatabaseConnectionSummary[];
  loading: boolean;
  loadError: string | null;
  onConnect(input: { provider: DatabaseProvider; credential: string; baseUrl: string }): Promise<string | null>;
  onDisconnect(connectionId: string): Promise<string | null>;
  onClose(): void;
}

export default function ErdDatabaseDialog(props: Props) {
  const [openProvider, setOpenProvider] = useState<DatabaseProvider | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const disconnect = async (connection: DatabaseConnectionSummary) => {
    setDisconnectingId(connection.id);
    setDisconnectError(null);

    const error = await props.onDisconnect(connection.id);

    setDisconnectingId(null);
    setDisconnectError(error);
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      title="Connect a database"
      description="Connect your account so the ERD agent can inspect and update databases in your projects. Credentials are verified, then stored encrypted."
      size="lg"
      onClose={props.onClose}>
      <div className="flex flex-col gap-2">
        {props.loading ? (
          <p
            role="status"
            className="text-xs text-foreground-off">
            Loading connections…
          </p>
        ) : null}

        {props.loadError || disconnectError ? (
          <p
            role="alert"
            className="text-xs text-alert-red">
            {props.loadError ?? disconnectError}
          </p>
        ) : null}

        {DATABASE_PROVIDERS.map(provider => {
          const connection = props.connections.find(item => item.provider === provider.id);
          const isFormOpen = openProvider === provider.id;

          return (
            <section
              key={provider.id}
              aria-label={provider.label}
              className="rounded-md border border-background-focus bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-medium">
                    {provider.label}
                    {connection ? (
                      <span className="flex items-center gap-1 font-normal text-foreground-off">
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-status-green" />
                        Connected{connection.credentialHint ? ` · ${connection.credentialHint}` : ""}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-off">
                    {provider.description}
                  </p>
                </div>

                {isFormOpen ? null : (
                  <div className="flex shrink-0 gap-2">
                    {connection ? (
                      <Button
                        variant="ghost"
                        onClick={() => void disconnect(connection)}
                        disabled={disconnectingId === connection.id}>
                        {disconnectingId === connection.id ? "Disconnecting…" : "Disconnect"}
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      onClick={() => setOpenProvider(provider.id)}>
                      {connection ? "Replace" : "Connect"}
                    </Button>
                  </div>
                )}
              </div>

              {isFormOpen ? (
                <ErdDatabaseConnectForm
                  provider={provider}
                  onConnect={props.onConnect}
                  onCancel={() => setOpenProvider(null)} />
              ) : null}
            </section>
          );
        })}
      </div>
    </Dialog>
  );
}
