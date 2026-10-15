"use client";

import { useRouter } from "next/navigation";

import DashLayout from "@/components/layouts/dash";
import SettingsSkeleton from "@/components/settings/settings-skeleton";

export default function SettingsLoading() {
  const router = useRouter();

  return (
    <DashLayout current="settings" router={router}>
      <main className="min-w-0 w-full pb-16">
        <div className="mx-auto flex w-full max-w-200 flex-col gap-8 px-4 pt-8 md:px-0">
          <header className="flex flex-col gap-1 border-b border-background-focus pb-6">
            <h1 className="font-heading text-2xl font-medium">Settings</h1>
            <p className="text-xs text-foreground-off">
              Manage your profile, billing, AI providers, and account security.
            </p>
          </header>
          <SettingsSkeleton />
        </div>
      </main>
    </DashLayout>
  );
}
