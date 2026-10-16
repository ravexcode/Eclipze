import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/constants/plans";
import type { UserPlan } from "@/types/user";

export function formatPlanPrice(plan: Pick<SubscriptionPlan, "priceCents" | "billing">) {
  if (plan.billing === "free") {
    return "Free";
  }

  const price = (plan.priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  });

  return plan.billing === "monthly_per_seat"
    ? `${price} / seat / month`
    : `${price} / month`;
}

export function getPlanName(plan: UserPlan) {
  const subscriptionPlan = SUBSCRIPTION_PLANS.find(item => item.key === plan.toLowerCase());

  return subscriptionPlan?.name ?? "Free";
}
