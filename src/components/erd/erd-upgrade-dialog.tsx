"use client";

import { IconCheck, IconCircleDashed } from "@tabler/icons-react";

import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import { ERD_ALLOWED_PLANS, ERD_UPGRADE_PLANS } from "@/constants/erd";
import { SUBSCRIPTION_PLANS } from "@/constants/plans";
import type { UserPlan, UserRole } from "@/types/user";
import { formatPlanPrice } from "@/utils/plans";

interface Props {
  isOpen: boolean;
  role: UserRole;
  plan: UserPlan;
  onClose(): void;
}

export default function ErdUpgradeDialog(props: Props) {
  const isDeveloper = props.role === "DEVELOPER";
  const hasPaidPlan = ERD_ALLOWED_PLANS.includes(props.plan);
  const currentPlan = SUBSCRIPTION_PLANS.find(plan => plan.key === props.plan.toLowerCase());

  const requirements = [
    {
      label: "Developer account",
      detail: isDeveloper ? "Enabled" : "Switch in Settings",
      isMet: isDeveloper,
    },
    {
      label: "Paid plan",
      detail: hasPaidPlan ? currentPlan?.name : `Current plan: ${currentPlan?.name ?? "Free"}`,
      isMet: hasPaidPlan,
    },
  ];

  return (
    <Dialog
      isOpen={props.isOpen}
      title="Upgrade to use ERD"
      description="Design entity relationship diagrams for your projects and export them to Prisma or PostgreSQL."
      size="lg"
      onClose={props.onClose}>
      <div className="flex flex-col gap-5">
        <ul className="flex flex-col divide-y divide-background-focus rounded-md border border-background-focus bg-background">
          {requirements.map(requirement => (
            <li
              key={requirement.label}
              className="flex items-center gap-3 px-3 py-2.5 text-xs">
              {requirement.isMet ? (
                <IconCheck size={15} strokeWidth={1.8} className="shrink-0 text-status-green" />
              ) : (
                <IconCircleDashed size={15} strokeWidth={1.8} className="shrink-0 text-foreground-off" />
              )}
              <span className="flex-1 font-medium">
                {requirement.label}
              </span>
              <span className="text-foreground-off">
                {requirement.detail}
              </span>
            </li>
          ))}
        </ul>

        <div className="grid gap-2 sm:grid-cols-3">
          {ERD_UPGRADE_PLANS.map(plan => (
            <article
              key={plan.key}
              className={`flex flex-col gap-3 rounded-md border bg-background p-3 ${plan.key === "max" ? "border-accent" : "border-background-focus"}`}>
              <div>
                <p className="text-sm font-medium">
                  {plan.name}
                </p>
                <p className="mt-0.5 text-xs text-foreground-off">
                  {formatPlanPrice(plan)}
                </p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {plan.features.slice(1).map(feature => (
                  <li
                    key={feature}
                    className="flex items-start gap-1.5 text-[11px] leading-4 text-foreground-off">
                    <IconCheck size={12} strokeWidth={1.8} className="mt-0.5 shrink-0 text-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="text-xs text-foreground-off">
          Online plan checkout is not available yet.
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            onClick={props.onClose}>
            Back to overview
          </Button>
          {!isDeveloper ? (
            <Button
              variant="secondary"
              href="/profile/settings">
              Enable developer access
            </Button>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
