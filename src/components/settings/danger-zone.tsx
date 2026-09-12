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

export default function DangerZone(props: {
  user: SessionUser;
  onDeleted(): void;
}) {
  const [password, setPassword] = useState("");
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
  const canDelete = Date.now() >= deletionDate.getTime();
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
    <section className="flex w-full flex-col gap-5 rounded-sm bg-background-card p-5 md:p-6">
      <div className="flex items-start gap-3">
        <IconAlertTriangle className="mt-0.5 shrink-0 text-red-400" size={18} />
        <div>
          <h2 className="text-base font-semibold">Delete account</h2>
          <p className="mt-1 text-sm text-foreground-off">
            Account deletion permanently removes your account and workspace
            data.
          </p>
        </div>
      </div>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <label
          className="flex flex-col gap-1.5 text-sm"
          htmlFor="accountDeletionPassword"
        >
          Current password
          <SettingsInput
            id="accountDeletionPassword"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            disabled={!canDelete || isDeleting}
          />
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
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete account"}
          </Button>
        </div>
      </form>
    </section>
  );
}
