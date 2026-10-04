"use client";

import { useRouter } from "next/navigation";

import DashLayout from "@/components/layouts/dash";
import SettingsSkeleton from "@/components/settings/settings-skeleton";

export default function SettingsLoading() {
  const router = useRouter();

  return (
    <DashLayout current="settings" router={router}>
      <main className="min-w-0 w-full pb-16">
        <div className="mx-auto flex w-full max-w-400 flex-col px-4 pt-5 md:px-0">
          <SettingsSkeleton />
        </div>
      </main>
    </DashLayout>
  );
}
