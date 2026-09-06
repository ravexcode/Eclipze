const GREETINGS: Array<(username: string) => string> = [
  (username) => `Good to see you, ${username}`,
  () => "Welcome back",
  (username) => `Ready to get things done, ${username}?`,
  () => "Let's get started",
  (username) => `Great to have you here, ${username}`,
  () => "Good to have you back",
  (username) => `Let's make some progress, ${username}`,
  () => "Ready when you are",
  (username) => `Let's get to work, ${username}`,
  () => "Back at it?",
  (username) => `What are we working on today, ${username}?`,
  () => "Let's make it happen",
  (username) => `Time to get things done, ${username}`,
  () => "Let's dive in",
  (username) => `Good to have you here, ${username}`,
  () => "Ready for another round?",
  (username) => `Let's get things moving, ${username}`,
  () => "What can we accomplish today?",
  (username) => `Let's make some progress today, ${username}`,
  () => "Let's have a productive one",
];

const GREETING_HISTORY_KEY = "greeting-history";
const MAX_HISTORY = 3;

export function getGreeting(username: string): string {
  if (!username.trim()) {
    throw new Error("Username is required");
  }

  const history = getGreetingHistory();

  const availableGreetings = GREETINGS.filter(
    (_, index) => !history.includes(index)
  );

  const pool =
    availableGreetings.length > 0
      ? availableGreetings
      : GREETINGS;

  const selectedIndex = Math.floor(Math.random() * pool.length);
  const selectedGreeting = pool[selectedIndex];

  const originalIndex = GREETINGS.indexOf(selectedGreeting);

  saveGreetingHistory(originalIndex);

  return selectedGreeting(username.trim());
}

function getGreetingHistory(): number[] {
  try {
    const stored = localStorage.getItem(GREETING_HISTORY_KEY);

    if (!stored) return [];

    const history = JSON.parse(stored);

    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

function saveGreetingHistory(index: number): void {
  const history = getGreetingHistory();

  const updatedHistory = [
    index,
    ...history.filter((item) => item !== index),
  ].slice(0, MAX_HISTORY);

  localStorage.setItem(
    GREETING_HISTORY_KEY,
    JSON.stringify(updatedHistory)
  );
}
