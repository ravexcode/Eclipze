export const USAGE_RESET_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

// Ordered from lowest to highest; the first threshold the available percent fits wins.
export const USAGE_BAR_THRESHOLDS = [
  {
    maximumPercent: 10,
    className: "bg-priority-high",
  },
  {
    maximumPercent: 30,
    className: "bg-priority-medium",
  },
];

export const USAGE_BAR_DEFAULT_CLASS = "bg-accent";
