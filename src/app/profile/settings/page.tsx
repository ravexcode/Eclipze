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
        className="w-full pb-16">
        <div
          className="mx-auto flex w-full max-w-250 flex-col px-4 pt-5 md:px-0">
          {user ? (
            <div className="flex flex-col gap-7 w-full">
              <ProfileSection
                user={user}
                avatarUrl={previewAvatar}
                onSaved={setUser} />
              <AiCreditsSection />
              <ProvidersSection />
              <section className="flex flex-col gap-2.5">
                <h2 className="text-sm font-medium text-alert-red">Danger zone</h2>
                <div className="flex flex-col gap-2">
                  <DangerZone
                    user={user}
                    onDeleted={() => {
                      router.replace("/auth/signin");
                      router.refresh();
                    }} />
                  <PasswordSection onSaved={setUser} />
                </div>
              </section>
              <DeveloperAccountSection user={user} onChanged={setUser} />
            </div>
          ) : (
            <SettingsSkeleton />
          )}
        </div>

      </main>

    </DashLayout>
  );
}
