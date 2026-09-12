"use client";

import { useState } from "react";
import { IconLock } from "@tabler/icons-react";

import Button from "@/components/ui/button";
import { apiFetch } from "@/utils/api-fetch";
import { setSessionUser } from "@/utils/session";
import type { SessionUser } from "@/types/user";
import SettingsFeedback from "./settings-feedback";
import SettingsInput from "./settings-input";

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
    <section className="overflow-hidden rounded-sm bg-background-card">
      <button
        type="button"
        className={`flex min-h-14 w-full items-center justify-between px-4 text-left text-base font-semibold duration-300 hover:bg-background-focus focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${isOpen ? "bg-background-focus" : ""}`}
        onClick={() => {
          setIsOpen((value) => !value);
          setError(null);
          setMessage(null);
        }}
        aria-expanded={isOpen}
        aria-controls="password-settings-panel"
      >
        <span>Change password</span>
        <IconLock size={20} strokeWidth={1.8} className="text-foreground-off" />
      </button>
      {isOpen ? (
        <form
          id="password-settings-panel"
          className="grid gap-4 px-4 py-5 md:grid-cols-3"
          onSubmit={onSubmit}
        >
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
