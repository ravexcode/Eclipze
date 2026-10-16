"use client";

import { IconCircleDashed, IconCoins } from "@tabler/icons-react";

import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";

interface Props {
  isOpen: boolean;
  onClose(): void;
}

export default function ErdUpgradeDialog(props: Props) {
  return (
    <Dialog
      isOpen={props.isOpen}
      title="Enable developer access to use ERD"
      description="Design entity relationship diagrams for your projects and export them to Prisma or PostgreSQL."
      size="lg"
      onClose={props.onClose}>
      <div className="flex flex-col gap-5">
        <ul className="flex flex-col divide-y divide-background-focus rounded-md border border-background-focus bg-background">
          <li className="flex items-center gap-3 px-3 py-2.5 text-xs">
            <IconCircleDashed size={15} strokeWidth={1.8} className="shrink-0 text-foreground-off" />
            <span className="flex-1 font-medium">
              Developer account
            </span>
            <span className="text-foreground-off">
              Switch in Settings
            </span>
          </li>
          <li className="flex items-center gap-3 px-3 py-2.5 text-xs">
            <IconCoins size={15} strokeWidth={1.8} className="shrink-0 text-foreground-off" />
            <span className="flex-1 font-medium">
              ERD agent
            </span>
            <span className="text-foreground-off">
              Uses your AI credits
            </span>
          </li>
        </ul>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            onClick={props.onClose}>
            Back to overview
          </Button>
          <Button
            variant="secondary"
            href="/profile/settings">
            Enable developer access
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
