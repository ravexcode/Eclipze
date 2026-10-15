"use client";

import { useState } from "react";
import { IconCode } from "@tabler/icons-react";

import Button from "@/components/ui/button";
import type { SessionUser } from "@/types/user";
import { apiFetch } from "@/utils/api-fetch";
import { setSessionUser } from "@/utils/session";
import SettingsFeedback from "./settings-feedback";
import SettingsRow from "./settings-row";
import SettingsSection from "./settings-section";

export default function DeveloperAccountSection(props: {
  user: SessionUser;
  onChanged(user: SessionUser): void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  const changeAccount = async () => {
    if (!window.confirm("Change this account to a developer account? It will be able to manage every issue.")) return;
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
      props.onChanged(data.user);
      window.dispatchEvent(new Event("user-updated"));
    } catch {
      setError("Unable to change account type.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <SettingsSection
      title="Developer access"
      description="Developer accounts have access to developer tools.">
      <SettingsRow
        title={props.user.role === "DEVELOPER" ? "Developer account" : "Standard account"}
        detail={props.user.role === "DEVELOPER"
          ? "This account can manage every issue."
          : "Switch to manage every issue in the workspace."}
        leading={<IconCode size={16} strokeWidth={1.7} />}
        action={(
          <Button
            type="button"
            variant="secondary"
            onClick={() => void changeAccount()}
            disabled={isChanging || props.user.role === "DEVELOPER"}
          >
            {props.user.role === "DEVELOPER" ? "Enabled" : isChanging ? "Changing..." : "Switch"}
          </Button>
        )} />
      <SettingsFeedback error={error} message={null} />
    </SettingsSection>
  );
}
