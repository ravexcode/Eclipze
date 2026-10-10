"use client";

// Set up
interface Props {
  profile: User
}

// Types import
import type { User } from "@/types/user";

// Icons imports
import {
  IconLogout,
  IconSettings,
  IconUserCircle
} from "@tabler/icons-react";

// Next imports
import Image from "next/image";
import Link from "next/link";

import { useRouter } from "next/navigation";

// React imports
import { useState } from "react";

// Components imports
import { useAnnouncements } from "@/components/announcements/announcement-provider";

// Utils imports
import { apiFetch } from "@/utils/api-fetch";
import { invalidateSessionUser } from "@/utils/session";

export default function UserProfile({ profile }: Props) {
  const router = useRouter();
  const { announce } = useAnnouncements();
  const [visible, setVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await apiFetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to log out. Please try again.");
      }

      invalidateSessionUser();
      router.replace("/auth/signin");
      router.refresh();
    } catch (error) {
      announce({
        message: error instanceof Error ? error.message : "Unable to log out. Please try again.",
        variant: "error",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Constants
  const avatarClass = "aspect-square w-6 rounded-full";

  return (
    <section
      className="w-full relative mt-auto">
      <button
        className="w-full rounded-md hover:bg-background-focus cursor-pointer p-2 flex gap-2 items-center justify-start"
        onClick={() => setVisible(prev => !prev)} >
        {
          profile.avatar ?
            <Image
              src={profile.avatar}
              alt={profile.name + " avatar profile"}
              width={30}
              height={30}
              className={avatarClass}
              unoptimized /> :
            <IconUserCircle
              size={20}
              stroke={1.5}
              className={avatarClass} />
        }

        <p
          className="w-full text-sm text-start">
          {profile.name}
        </p>
      </button>

      {
        visible &&
        <div
          className="w-full absolute bottom-1/1 -translate-y-3 rounded-sm flex flex-col items-center justify-center text-sm">
          <Link
            href="/profile/settings"
            className="flex gap-2 items-center justify-start w-full p-2 hover:backdrop-brightness-200">
            <IconSettings
              size={15}
              stroke={2} />
            <p>
              Settings
            </p>
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="flex gap-2 items-center justify-start w-full p-2 hover:backdrop-brightness-200 cursor-pointer">
            <IconLogout
              size={15}
              stroke={2} />
            <p>
              Logout
            </p>
          </button>
        </div>
      }
    </section>
  )
}
