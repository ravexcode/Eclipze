"use client";

// Next Setup
import { useRouter } from "next/navigation";

// React imports
import { useEffect, useState } from "react";

// Components imports
import ErdUpgradeDialog from "@/components/erd/erd-upgrade-dialog";
import ErdWorkspace from "@/components/erd/erd-workspace";
import DashLayout from "@/components/layouts/dash";

// Types
import type { SessionUser } from "@/types/user";

// Utils
import { canAccessErd } from "@/utils/erd";
import { getSessionUser } from "@/utils/session";

export default function ERDPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void getSessionUser().then(sessionUser => {
      if (!cancelled) {
        setUser(sessionUser);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const closeUpgrade = () => {
    setShowUpgrade(false);
    router.push("/dashboard");
  };

  return (
    <DashLayout
      current="erd"
      router={router}>
      {user && canAccessErd(user) ? (
        <ErdWorkspace />
      ) : user ? (
        <ErdUpgradeDialog
          isOpen={showUpgrade}
          onClose={closeUpgrade} />
      ) : null}
    </DashLayout>
  );
}
