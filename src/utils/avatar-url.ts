export function normalizeAvatarUrl(value: string) {
  return value.trim();
}

export function isValidAvatarUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
