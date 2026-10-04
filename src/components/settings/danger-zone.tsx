"use client";

import { useMemo, useState, type FormEvent } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";

import Button from "@/components/ui/button";
import { ACCOUNT_DELETION_DELAY_DAYS, type SessionUser } from "@/types/user";
import { apiFetch } from "@/utils/api-fetch";
import CacheDB from "@/utils/cache";
import { clearSessionUser } from "@/utils/session";
import SettingsFeedback from "./settings-feedback";
import SettingsInput from "./settings-input";
import SettingsRow from "./settings-row";

export default function DangerZone(props: {
  user: SessionUser;
  onDeleted(): void;
}) {
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deletionDate = useMemo(
    () =>
      new Date(
        new Date(props.user.createdAt).getTime() +
          ACCOUNT_DELETION_DELAY_DAYS * 24 * 60 * 60 * 1000,
      ),
    [props.user.createdAt],
  );
  const [currentTime] = useState(() => Date.now());
  const canDelete = currentTime >= deletionDate.getTime();
  const dateLabel = deletionDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!canDelete) {
      setError("Account deletion is not available yet.");
      return;
    }
    if (
      !window.confirm(
        "Delete your account and all workspace data? This action cannot be undone.",
      )
    )
      return;
    setIsDeleting(true);
    try {
      const response = await apiFetch("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { message: string };
      if (!response.ok) {
        setError(data.message);
        return;
      }
      clearSessionUser();
      CacheDB.delete(props.user.id);
      props.onDeleted();
    } catch {
      setError("Unable to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="flex flex-col gap-1">
      <SettingsRow
        title="Delete my account"
        tone="danger"
        expanded={isOpen}
        controls="account-deletion-panel"
        onClick={() => setIsOpen((open) => !open)} />
      {isOpen ? (
        <form
          id="account-deletion-panel"
          className="flex flex-col gap-3 rounded-sm border border-alert-red/40 bg-background-card p-4"
          onSubmit={onSubmit}>
          <div className="flex items-start gap-2 text-xs text-foreground-off">
            <IconAlertTriangle className="mt-0.5 shrink-0 text-alert-red" size={15} />
            <p>Account deletion permanently removes your account and workspace data.</p>
          </div>
          <label
            className="flex flex-col gap-1.5 text-sm"
            htmlFor="accountDeletionPassword">
            Current password
            <SettingsInput
              id="accountDeletionPassword"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={!canDelete || isDeleting} />
          </label>
          <p className="text-xs text-foreground-off">
            {canDelete
              ? "This action cannot be undone."
              : `Deletion becomes available on ${dateLabel}.`}
          </p>
          <SettingsFeedback error={error} message={null} />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="secondary"
              className="text-alert-red hover:text-alert-red"
              disabled={!canDelete || isDeleting}>
              {isDeleting ? "Deleting..." : "Confirm deletion"}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
