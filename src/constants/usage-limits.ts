export const USAGE_LIMIT_TICKS = [0, 25, 50, 75, 100];

export const USAGE_LIMIT_TONES = [
  {
    minimumPercent: 50,
    bar: "bg-foreground",
    label: "text-foreground",
  },
  {
    minimumPercent: 20,
    bar: "bg-warning",
    label: "text-warning",
  },
  {
    minimumPercent: 0,
    bar: "bg-alert-red",
    label: "text-alert-red",
  },
];

export const USAGE_RESET_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export const USAGE_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});
