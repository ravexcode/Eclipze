"use client";

import Image from "next/image";
import { useState } from "react";
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
  avatarUrl: string;
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

  const displayName = props.user.username || props.user.email.split("@")[0] || "Your account";

  return (
    <section className="flex flex-col gap-2">
      <button
        type="button"
        className={`flex min-h-14 w-full items-center gap-3 rounded-sm bg-background-card px-3 py-2 text-left hover:bg-background-focus focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${isOpen ? "bg-background-focus" : ""}`}
        onClick={() => {
          setIsOpen((value) => !value);
          setError(null);
          setMessage(null);
        }}
        aria-expanded={isOpen}
        aria-controls="profile-settings-panel">
        <Image
          src={props.avatarUrl}
          alt=""
          width={36}
          height={36}
          unoptimized
          className="h-9 w-9 shrink-0 rounded-full bg-background-focus object-cover" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-1.5 text-base font-medium">
            <span className="truncate">{displayName}</span>
            <IconPencil size={14} strokeWidth={1.7} className="shrink-0 text-foreground-off" />
          </span>
          <span className="truncate text-xs text-foreground-off">{props.user.email}</span>
        </span>
      </button>
      {isOpen ? (
        <form
          id="profile-settings-panel"
          className="grid gap-4 rounded-sm bg-background-card p-4 md:grid-cols-2"
          onSubmit={onSubmit}>
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
