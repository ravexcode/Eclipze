"use client";

import { useEffect, useMemo, useState } from "react";

import DashLayout from "@/components/layouts/dash";
import Button from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import type { SessionUser } from "@/types/user";
import { isValidAvatarUrl, normalizeAvatarUrl } from "@/utils/avatar-url";
import { apiFetch } from "@/utils/api-fetch";
import { getSessionUser, setSessionUser } from "@/utils/session";

import { useRouter } from "next/navigation";

const USER_UPDATED_EVENT = "user-updated";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser = async () => {
      const currentUser = await getSessionUser();

      if (!currentUser) {
        router.replace("/auth/signin");
        return;
      }

      if (cancelled) {
        return;
      }

      setUser(currentUser);
      setAvatarUrl(currentUser.avatarUrl ?? "");
      setIsLoading(false);
    };

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const previewAvatar = useMemo(() => {
    const normalizedAvatarUrl = normalizeAvatarUrl(avatarUrl);

    if (!normalizedAvatarUrl) {
      return "/logo.svg";
    }

    return isValidAvatarUrl(normalizedAvatarUrl) ? normalizedAvatarUrl : "/logo.svg";
  }, [avatarUrl]);

  const onSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedAvatarUrl = normalizeAvatarUrl(avatarUrl);

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (normalizedAvatarUrl && !isValidAvatarUrl(normalizedAvatarUrl)) {
        setError("Please enter a valid image URL.");
        return;
      }

      const response = await apiFetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          avatarUrl: normalizedAvatarUrl,
        }),
      });

      const data = await response.json() as {
        message: string;
        user?: SessionUser;
      };

      if (!response.ok) {
        setError(data.message);
        return;
      }

      if (data.user) {
        setSessionUser(data.user);
        setUser(data.user);
        setAvatarUrl(data.user.avatarUrl ?? "");
      }

      window.dispatchEvent(new Event(USER_UPDATED_EVENT));
      setMessage(data.message);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("Please review the form fields and try again.");
  };

  return (
    <DashLayout current="settings" router={router}>
      <main className="w-full flex flex-col items-center justify-start">
        <Heading label="Profile settings" />

        <section className="w-full max-w-350 p-4 md:p-6 animate-fade-in-up">
          <div className="w-full rounded-sm bg-background-card p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={previewAvatar}
                  alt={user?.displayName ?? "User avatar preview"}
                  className="h-16 w-16 rounded-full bg-background-focus object-cover"
                />

                <div className="flex flex-col gap-1">
                  <p className="text-xl font-medium">
                    {user?.displayName ?? "Loading..."}
                  </p>
                  <p className="text-sm text-foreground-off">
                    {user?.email ?? "Fetching your account details..."}
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={onSubmit}
              onError={onError}
              className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm" htmlFor="avatarUrl">
                  Image URL
                </label>
                <input
                  id="avatarUrl"
                  type="url"
                  value={avatarUrl}
                  onChange={(event) => {
                    setAvatarUrl(event.target.value);
                  }}
                  placeholder="https://example.com/avatar.png"
                  autoComplete="url"
                  disabled={isLoading || isSubmitting}
                  className="w-full rounded-sm border border-transparent bg-background-focus px-3 py-2 text-sm outline-none duration-300 focus:border-accent disabled:pointer-events-none disabled:opacity-50"
                />
                <p className="text-xs text-foreground-off">
                  Use an absolute image URL. Leave it empty to use the default avatar.
                </p>
              </div>

              {
                error ? (
                  <p className="text-sm text-red-400">{error}</p>
                ) : null
              }

              {
                message ? (
                  <p className="text-sm text-green-400">{message}</p>
                ) : null
              }

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    router.push("/dashboard");
                  }}
                  disabled={isSubmitting}>
                  Back to dashboard
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading || isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </DashLayout>
  );
}
