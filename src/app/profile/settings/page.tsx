"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DashLayout from "@/components/layouts/dash";
import DangerZone from "@/components/settings/danger-zone";
import DeveloperAccountSection from "@/components/settings/developer-account-section";
import AiCreditsSection from "@/components/settings/ai-credits-section";
import PasswordSection from "@/components/settings/password-section";
import ProfileSection from "@/components/settings/profile-section";
import ProvidersSection from "@/components/settings/providers-section";
import SettingsSection from "@/components/settings/settings-section";
import SettingsSkeleton from "@/components/settings/settings-skeleton";

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
      if (!currentUser) router.refresh();
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
        className="w-full pb-16">
        <div
          className="mx-auto flex w-full max-w-200 flex-col gap-8 px-4 pt-8 md:px-0">
          <header className="flex flex-col gap-1 border-b border-background-focus pb-6">
            <h1 className="font-heading text-2xl font-medium">Settings</h1>
            <p className="text-xs text-foreground-off">
              Manage your profile, billing, AI providers, and account security.
            </p>
          </header>
          {user ? (
            <div className="flex w-full flex-col gap-10">
              <ProfileSection
                user={user}
                avatarUrl={previewAvatar}
                onSaved={setUser} />
              <AiCreditsSection />
              <ProvidersSection />
              <DeveloperAccountSection
                user={user}
                onChanged={setUser} />
              <SettingsSection
                title="Danger zone"
                description="Sensitive actions that affect access to your account."
                tone="danger">
                <PasswordSection onSaved={setUser} />
                <DangerZone
                  user={user}
                  onDeleted={() => {
                    router.replace("/auth/signin");
                    router.refresh();
                  }} />
              </SettingsSection>
            </div>
          ) : (
            <SettingsSkeleton />
          )}
        </div>
      </main>

    </DashLayout>
  );
}
