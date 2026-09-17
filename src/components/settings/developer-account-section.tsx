"use client";

import { useState } from "react";
import { IconCode } from "@tabler/icons-react";

import Button from "@/components/ui/button";
import type { SessionUser } from "@/types/user";
import { apiFetch } from "@/utils/api-fetch";
import CacheDB, { IssuesCache } from "@/utils/cache";
import { setSessionUser } from "@/utils/session";
import SettingsFeedback from "./settings-feedback";

export default function DeveloperAccountSection(props: {
  user: SessionUser;
  onChanged(user: SessionUser): void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  const changeAccount = async () => {
    if (!window.confirm("¿Cambiar esta cuenta a desarrollador? Tendrá acceso a todos los Issues.")) return;
    setError(null);
    setIsChanging(true);

    try {
      const response = await apiFetch("/api/account/developer", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json() as { user?: SessionUser; message?: string };
      if (!response.ok || !data.user) {
        setError(data.message ?? "Unable to change account type.");
        return;
      }

      setSessionUser(data.user);
      CacheDB.delete(data.user.id);
      IssuesCache.delete(data.user.id);
      props.onChanged(data.user);
      window.dispatchEvent(new Event("user-updated"));
    } catch {
      setError("Unable to change account type.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <section className="flex w-full flex-col gap-4 rounded-sm bg-background-card p-5 md:p-6">
      <div className="flex items-start gap-3">
        <IconCode className="mt-0.5 shrink-0 text-foreground-off" size={18} />
        <div>
          <h2 className="text-base font-semibold">Developer access</h2>
          <p className="mt-1 text-sm text-foreground-off">
            Developer accounts can manage every Issue in Eclipze.
          </p>
        </div>
      </div>
      <SettingsFeedback error={error} message={null} />
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void changeAccount()}
          disabled={isChanging || props.user.role === "DEVELOPER"}
        >
          {props.user.role === "DEVELOPER" ? "Cuenta de desarrollador" : isChanging ? "Cambiando..." : "Cambiar cuenta a desarollador"}
        </Button>
      </div>
    </section>
  );
}
