import type { SubscriptionPlan } from "@/constants/plans";

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
