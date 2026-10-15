export const AI_CREDIT_USAGE_WINDOWS = [
  {
    key: "fiveHour",
    label: "5h",
    limitCredits: 15,
    durationMs: 5 * 60 * 60 * 1_000,
  },
  {
    key: "weekly",
    label: "Weekly",
    limitCredits: 75,
    durationMs: 7 * 24 * 60 * 60 * 1_000,
  },
] as const;
