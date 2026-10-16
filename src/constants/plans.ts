// Prices are in USD cents and include taxes, matching Stripe's minor-unit amounts.
// Credits use the AI credit unit: 1,000 credits = 1 USD.

export type PlanKey = "free" | "plus" | "max" | "team";

export type PlanModelTier = "standard" | "advanced";

export type SubscriptionPlan = {
  key: PlanKey;
  name: string;
  description: string;
  priceCents: number;
  billing: "free" | "monthly" | "monthly_per_seat";
  minimumSeats: number;
  monthlyCredits: number;
  creditsScope: "user" | "team_pool";
  modelTier: PlanModelTier;
  usageWindows: {
    fiveHourCredits: number;
    weeklyCredits: number;
  };
  stripePriceEnv: string | null;
  features: string[];
};

export const SUBSCRIPTION_PLANS = [
  {
    key: "free",
    name: "Free",
    description: "Try Eclipze with a small monthly AI allowance.",
    priceCents: 0,
    billing: "free",
    minimumSeats: 1,
    monthlyCredits: 300,
    creditsScope: "user",
    modelTier: "standard",
    usageWindows: {
      fiveHourCredits: 15,
      weeklyCredits: 75,
    },
    stripePriceEnv: null,
    features: [
      "Projects, issues, and messages",
      "Bring your own AI provider keys",
      "$0.30 in monthly AI credits",
    ],
  },
  {
    key: "plus",
    name: "Plus",
    description: "More AI credits and higher limits for individual work.",
    priceCents: 500,
    billing: "monthly",
    minimumSeats: 1,
    monthlyCredits: 2_000,
    creditsScope: "user",
    modelTier: "standard",
    usageWindows: {
      fiveHourCredits: 100,
      weeklyCredits: 500,
    },
    stripePriceEnv: "STRIPE_PRICE_PLUS",
    features: [
      "Everything in Free",
      "$2 in monthly AI credits",
      "Higher 5-hour and weekly usage limits",
      "Credit top-ups",
    ],
  },
  {
    key: "max",
    name: "Max",
    description: "Advanced models and the highest individual limits.",
    priceCents: 1_200,
    billing: "monthly",
    minimumSeats: 1,
    monthlyCredits: 5_000,
    creditsScope: "user",
    modelTier: "advanced",
    usageWindows: {
      fiveHourCredits: 250,
      weeklyCredits: 1_250,
    },
    stripePriceEnv: "STRIPE_PRICE_MAX",
    features: [
      "Everything in Plus",
      "$5 in monthly AI credits",
      "Access to advanced models",
      "Highest individual usage limits",
    ],
  },
  {
    key: "team",
    name: "Team",
    description: "Full access for teams, with shared credits and central billing.",
    priceCents: 1_500,
    billing: "monthly_per_seat",
    minimumSeats: 5,
    monthlyCredits: 5_000,
    creditsScope: "team_pool",
    modelTier: "advanced",
    usageWindows: {
      fiveHourCredits: 250,
      weeklyCredits: 1_250,
    },
    stripePriceEnv: "STRIPE_PRICE_TEAM",
    features: [
      "Everything in Max for every member",
      "$5 in monthly AI credits per seat, shared by the team",
      "Member management and central billing",
      "Minimum of 5 seats",
    ],
  },
] as const satisfies SubscriptionPlan[];

export const PLAN_CREDIT_RULES = {
  // Monthly plan credits expire at the end of each billing period.
  monthlyCreditsRollOver: false,
  // Changing plans replaces the remaining monthly credits with the new plan's allowance.
  monthlyCreditsResetOnPlanChange: true,
  // Purchased top-up credits are kept until they are used.
  topUpCreditsExpire: false,
  creditsRefundable: false,
  creditsTransferable: false,
};
