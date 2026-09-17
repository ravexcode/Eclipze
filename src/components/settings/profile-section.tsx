"use client";

import { useState, type SyntheticEvent } from "react";
import { IconPencil } from "@tabler/icons-react";

import Button from "@/components/ui/button";
import type { SessionUser } from "@/types/user";
import { isValidAvatarUrl, normalizeAvatarUrl } from "@/utils/avatar-url";
import { apiFetch } from "@/utils/api-fetch";
import { setSessionUser } from "@/utils/session";
import SettingsFeedback from "./settings-feedback";
import SettingsInput from "./settings-input";

export default function ProfileSection(props: {
  user: SessionUser;
  onSaved(user: SessionUser): void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState(props.user.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(props.user.avatarUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedAvatarUrl = normalizeAvatarUrl(avatarUrl);
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      if (normalizedAvatarUrl && !isValidAvatarUrl(normalizedAvatarUrl)) {
        setError("Please enter a valid image URL.");
        return;
      }

      const response = await apiFetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          avatarUrl: normalizedAvatarUrl,
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
        setUsername(data.user.username ?? "");
        setAvatarUrl(data.user.avatarUrl ?? "");
        props.onSaved(data.user);
      }

      window.dispatchEvent(new Event("user-updated"));
      setMessage(data.message);
    } catch {
      setError("Unable to save profile changes.");
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
        }}>
        <span>
          Change username
        </span>
        <IconPencil
          size={20}
          strokeWidth={1.5}
          className="text-foreground-off"/>
      </button>
      {isOpen ? (
        <form
          id="profile-settings-panel"
          className="grid gap-4 px-4 py-5 md:grid-cols-2"
          onSubmit={onSubmit}
          onError={(event: SyntheticEvent) => {
            event.preventDefault();
            setError("Please review the form fields and try again.");
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm" htmlFor="username">
            Username
            <SettingsInput
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Your username"
              autoComplete="username"
              minLength={3}
              maxLength={24}
              pattern="[a-zA-Z0-9_-]{3,24}"
              required
              disabled={isSaving}
            />
            <span className="text-xs text-foreground-off">
              3-24 letters, numbers, underscores, or hyphens.
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm" htmlFor="avatarUrl">
            Image URL
            <SettingsInput
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://example.com/avatar.png"
              autoComplete="url"
              disabled={isSaving}
            />
            <span className="text-xs text-foreground-off">
              Leave empty to use default avatar.
            </span>
          </label>
          <div className="flex flex-col gap-3 md:col-span-2">
            <SettingsFeedback error={error} message={message} />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </section>
  );
}
