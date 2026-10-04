"use client";

import { useState } from "react";

import Button from "@/components/ui/button";
import { apiFetch } from "@/utils/api-fetch";
import { setSessionUser } from "@/utils/session";
import type { SessionUser } from "@/types/user";
import SettingsFeedback from "./settings-feedback";
import SettingsInput from "./settings-input";
import SettingsRow from "./settings-row";

export default function PasswordSection(props: {
  onSaved(user: SessionUser): void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await apiFetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          password: newPassword,
          passwordConfirm,
        }),
      });
      const data = (await response.json()) as {
        message: string;
        user?: SessionUser;
      };
      if (!response.ok) {
        setError(data.message);
        return;
      }
      if (data.user) {
        setSessionUser(data.user);
        props.onSaved(data.user);
      }
      setCurrentPassword("");
      setNewPassword("");
      setPasswordConfirm("");
      setMessage(data.message);
    } catch {
      setError("Unable to update password.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-1">
      <SettingsRow
        title="Change my password"
        tone="danger"
        expanded={isOpen}
        controls="password-settings-panel"
        onClick={() => {
          setIsOpen((value) => !value);
          setError(null);
          setMessage(null);
        }} />
      {isOpen ? (
        <form
          id="password-settings-panel"
          className="grid gap-4 rounded-sm border border-alert-red/40 bg-background-card p-4 md:grid-cols-3"
          onSubmit={onSubmit}>
          <label
            className="flex flex-col gap-1.5 text-sm"
            htmlFor="currentPassword"
          >
            Current password
            <SettingsInput
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={isSaving}
            />
          </label>
          <label
            className="flex flex-col gap-1.5 text-sm"
            htmlFor="newPassword"
          >
            New password
            <SettingsInput
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              disabled={isSaving}
            />
          </label>
          <label
            className="flex flex-col gap-1.5 text-sm"
            htmlFor="passwordConfirm"
          >
            Confirm password
            <SettingsInput
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              disabled={isSaving}
            />
          </label>
          <div className="flex flex-col gap-3 md:col-span-3">
            <SettingsFeedback error={error} message={message} />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Updating..." : "Update password"}
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </section>
  );
}
