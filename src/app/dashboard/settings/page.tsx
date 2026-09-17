"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DashLayout from "@/components/layouts/dash";
import DangerZone from "@/components/settings/danger-zone";
import DeveloperAccountSection from "@/components/settings/developer-account-section";
import PasswordSection from "@/components/settings/password-section";
import ProfileHeader from "@/components/settings/profile-header";
import ProfileSection from "@/components/settings/profile-section";
import ProvidersSection from "@/components/settings/providers-section";
import Heading from "@/components/ui/heading";
import type { SessionUser } from "@/types/user";
import { isValidAvatarUrl, normalizeAvatarUrl } from "@/utils/avatar-url";
import { getSessionUser } from "@/utils/session";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getSessionUser().then(currentUser => {
      if (cancelled) return;
      if (!currentUser) router.replace("/auth/signin");
      else setUser(currentUser);
    });
    return () => { cancelled = true; };
  }, [router]);

  const previewAvatar = useMemo(() => {
    const normalized = normalizeAvatarUrl(user?.avatarUrl ?? "");
    return normalized && isValidAvatarUrl(normalized) ? normalized : "/logo.svg";
  }, [user?.avatarUrl]);

  return (
    <DashLayout
      current="settings"
      router={router}>

      <main
        className="min-w-0 w-full pb-16">

        <Heading
          label="Settings" />

        <div
          className="mx-auto flex w-full max-w-212 flex-col gap-5 px-4 pt-7 md:px-6">

          <ProfileHeader
            user={user} avatarUrl={previewAvatar} />

          <div
            className="flex flex-col gap-1 pt-2">
            <h2
              className="text-base font-semibold tracking-[-0.01em]">
              Profile settings
            </h2>
            <p
              className="text-sm text-foreground-off">
              Manage your account details and security preferences.
            </p>
          </div>

          {
            user ? (
            <>
              <ProfileSection
                user={user}
                onSaved={setUser} />
              <PasswordSection
                onSaved={setUser} />
              <ProvidersSection />
              <DangerZone
                user={user}
                onDeleted={
                  () => {
                    router.replace("/auth/signin");
                    router.refresh();
                  }} />
              <DeveloperAccountSection
                user={user}
                onChanged={setUser} />
            </>
            ) : null
          }
        </div>

      </main>

    </DashLayout>
  );
}
