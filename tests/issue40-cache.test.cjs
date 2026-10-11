const assert = require("node:assert/strict");
const test = require("node:test");

const { loadTypeScript } = require("./helpers/load-typescript.cjs");

function createBrowser() {
  const entries = new Map();
  const events = [];
  const localStorage = {
    get length() {
      return entries.size;
    },
    key(index) {
      return [...entries.keys()][index] ?? null;
    },
    getItem(key) {
      return entries.get(key) ?? null;
    },
    setItem(key, value) {
      entries.set(key, String(value));
    },
    removeItem(key) {
      entries.delete(key);
    },
  };
  const window = {
    localStorage,
    dispatchEvent(event) {
      events.push(event.type);
      return true;
    },
  };

  return { entries, events, localStorage, window };
}

function createClock(start = 1_000) {
  let now = start;
  return {
    Date: class extends Date {
      static now() {
        return now;
      }
    },
    advance(milliseconds) {
      now += milliseconds;
    },
  };
}

test("issue cache is separated by account, role, and project/filter scope", () => {
  const browser = createBrowser();
  const cache = loadTypeScript("src/utils/cache.ts", {
    globals: { window: browser.window },
  }).IssuesCache;
  const issues = [{ id: "issue-1", title: "Private issue" }];

  cache.update("user-a", "USER", issues, 2, "project-a:open");

  assert.deepEqual(JSON.parse(JSON.stringify(cache.get("user-a", "USER", "project-a:open"))), {
    issues,
    unread: 2,
  });
  assert.equal(cache.get("user-b", "USER", "project-a:open"), null);
  assert.equal(cache.get("user-a", "DEVELOPER", "project-a:open"), null);
  assert.equal(cache.get("user-a", "USER", "project-b:open"), null);
  assert.equal(browser.entries.size, 0);
});

test("expired issue entries are removed from memory", () => {
  const browser = createBrowser();
  const clock = createClock();
  const cache = loadTypeScript("src/utils/cache.ts", {
    globals: { window: browser.window, Date: clock.Date },
  }).IssuesCache;

  cache.update("user-a", "USER", [{ id: "issue-1" }], 0, "all-issues");
  assert.notEqual(cache.get("user-a", "USER", "all-issues"), null);

  clock.advance(60_000);

  assert.equal(cache.get("user-a", "USER", "all-issues"), null);
});

test("legacy private cache keys are physically removed without touching other storage", () => {
  const browser = createBrowser();
  browser.localStorage.setItem("eclipze-workspace:user-a:v3", "old encrypted workspace");
  browser.localStorage.setItem("eclipze-issues:user-a:v1", "old encrypted issues");
  browser.localStorage.setItem("greeting-history", "[1,2]");
  browser.localStorage.setItem("agent-project-id", "project-a");

  loadTypeScript("src/utils/cache.ts", {
    globals: { window: browser.window },
  });

  assert.equal(browser.localStorage.getItem("eclipze-workspace:user-a:v3"), null);
  assert.equal(browser.localStorage.getItem("eclipze-issues:user-a:v1"), null);
  assert.equal(browser.localStorage.getItem("greeting-history"), "[1,2]");
  assert.equal(browser.localStorage.getItem("agent-project-id"), "project-a");
});

test("workspace snapshots can no longer be read from or written to persistent storage", () => {
  const browser = createBrowser();
  browser.localStorage.setItem("eclipze-workspace:user-a:v3", "legacy content");
  const cache = loadTypeScript("src/utils/cache.ts", {
    globals: { window: browser.window },
  }).default;

  assert.deepEqual(JSON.parse(JSON.stringify(cache.get("user-a"))), { message: "error" });
  assert.deepEqual(
    JSON.parse(JSON.stringify(cache.update({ user: { id: "user-a" } }))),
    { message: "error" },
  );
  assert.equal(browser.localStorage.getItem("eclipze-workspace:user-a:v3"), null);
  assert.equal(browser.localStorage.length, 0);
});

test("successful mutations clear in-memory issue data while failed mutations do not", async () => {
  const browser = createBrowser();
  const cacheModule = loadTypeScript("src/utils/cache.ts", {
    globals: { window: browser.window },
  });
  const cache = cacheModule.IssuesCache;
  let responseOk = false;
  const api = loadTypeScript("src/utils/api-fetch.ts", {
    globals: {
      window: browser.window,
      process: { env: { NEXT_PUBLIC_API_KEY: "test" } },
      fetch: async () => new Response(null, { status: responseOk ? 200 : 500 }),
    },
    mocks: { "@/utils/cache": cacheModule },
  });

  cache.update("user-a", "USER", [{ id: "issue-1" }], 1, "all-issues");
  await api.apiFetch("/api/issues", { method: "POST" });
  assert.notEqual(cache.get("user-a", "USER", "all-issues"), null);

  responseOk = true;
  await api.apiFetch("/api/issues", { method: "POST" });
  assert.equal(cache.get("user-a", "USER", "all-issues"), null);
  assert.ok(browser.events.includes("issues-cache-invalidated"));
});

test("session role/account changes and logout clear cached private issue data", () => {
  const browser = createBrowser();
  const cacheModule = loadTypeScript("src/utils/cache.ts", {
    globals: { window: browser.window },
  });
  const { IssuesCache } = cacheModule;
  const session = loadTypeScript("src/utils/session.ts", {
    globals: { window: browser.window },
    mocks: {
      "@/utils/api-fetch": { apiFetch: async () => new Response(null, { status: 401 }) },
      "@/utils/cache": cacheModule,
    },
  });
  const user = { id: "user-a", role: "USER" };

  session.setSessionUser(user);
  IssuesCache.update(user.id, user.role, [{ id: "issue-1" }], 1, "all-issues");
  session.setSessionUser({ ...user, role: "DEVELOPER" });
  assert.equal(IssuesCache.get(user.id, "USER", "all-issues"), null);

  IssuesCache.update(user.id, "DEVELOPER", [{ id: "issue-2" }], 0, "all-issues");
  session.setSessionUser({ ...user, id: "user-b", role: "USER" });
  assert.equal(IssuesCache.get(user.id, "DEVELOPER", "all-issues"), null);

  IssuesCache.update("user-b", "USER", [{ id: "issue-3" }], 0, "all-issues");
  session.clearSessionUser();
  assert.equal(IssuesCache.get("user-b", "USER", "all-issues"), null);
});

test("refreshSessionUser fetches the current role and clears cache after a role change", async () => {
  const browser = createBrowser();
  const cacheModule = loadTypeScript("src/utils/cache.ts", {
    globals: { window: browser.window },
  });
  let refreshedUser = { id: "user-a", role: "DEVELOPER" };
  let requests = 0;
  const session = loadTypeScript("src/utils/session.ts", {
    globals: { window: browser.window },
    mocks: {
      "@/utils/api-fetch": {
        apiFetch: async () => {
          requests += 1;
          return new Response(JSON.stringify({ user: refreshedUser }), { status: 200 });
        },
      },
      "@/utils/cache": cacheModule,
    },
  });
  const { IssuesCache } = cacheModule;

  session.setSessionUser({ id: "user-a", role: "USER" });
  IssuesCache.update("user-a", "USER", [{ id: "issue-1" }], 0, "all-issues");

  const user = await session.refreshSessionUser();

  assert.equal(requests, 1);
  assert.equal(user.role, "DEVELOPER");
  assert.equal(IssuesCache.get("user-a", "USER", "all-issues"), null);
});
