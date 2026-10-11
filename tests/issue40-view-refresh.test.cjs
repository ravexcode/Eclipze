const assert = require("node:assert/strict");
const test = require("node:test");

const { loadTypeScript } = require("./helpers/load-typescript.cjs");

function createHookFixture(refresh, clear = () => {}) {
  const refs = [];
  let effectCleanup = null;
  let intervalCallback = null;
  let intervalCleared = false;
  const window = new EventTarget();
  const document = new EventTarget();
  document.visibilityState = "visible";
  window.setInterval = callback => {
    intervalCallback = callback;
    return 42;
  };
  window.clearInterval = timerId => {
    assert.equal(timerId, 42);
    intervalCleared = true;
  };

  const react = {
    useRef(initialValue) {
      const ref = { current: initialValue };
      refs.push(ref);
      return ref;
    },
    useCallback(callback) {
      return callback;
    },
    useEffect(effect) {
      effectCleanup = effect();
    },
  };
  const { useIssueRefresh } = loadTypeScript("src/utils/use-issue-refresh.ts", {
    mocks: { react },
    globals: { window, document },
  });
  const reload = useIssueRefresh(refresh, clear);

  return {
    document,
    get intervalCleared() {
      return intervalCleared;
    },
    get intervalCallback() {
      return intervalCallback;
    },
    reload,
    unmount() {
      effectCleanup();
    },
    window,
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function nextMicrotaskTurn() {
  return new Promise(resolve => setImmediate(resolve));
}

test("mount triggers an initial server revalidation", async () => {
  const pending = deferred();
  const calls = [];
  const fixture = createHookFixture(signal => {
    calls.push(signal);
    return pending.promise;
  });

  await nextMicrotaskTurn();

  assert.equal(calls.length, 1);
  assert.equal(calls[0].aborted, false);
  fixture.unmount();
  assert.equal(calls[0].aborted, true);
  pending.resolve();
});

test("focus, visible change, and polling share one in-flight refresh", async () => {
  const pending = deferred();
  const calls = [];
  const fixture = createHookFixture(signal => {
    calls.push(signal);
    return pending.promise;
  });
  await nextMicrotaskTurn();

  fixture.window.dispatchEvent(new Event("focus"));
  fixture.document.dispatchEvent(new Event("visibilitychange"));
  fixture.intervalCallback();

  assert.equal(calls.length, 1);
  pending.resolve();
  await nextMicrotaskTurn();
  fixture.unmount();
});

test("cache invalidation clears the current view and aborts its older response", async () => {
  const requests = [];
  const committed = [];
  let clears = 0;
  const fixture = createHookFixture(signal => {
    const request = deferred();
    requests.push({ ...request, signal });
    return request.promise.then(value => {
      if (!signal.aborted) committed.push(value);
    });
  }, () => {
    clears += 1;
  });
  await nextMicrotaskTurn();
  const oldRequest = requests[0];

  fixture.window.dispatchEvent(new Event("issues-cache-invalidated"));

  assert.equal(clears, 1);
  assert.equal(oldRequest.signal.aborted, true);
  assert.equal(requests.length, 2);
  oldRequest.resolve("stale result");
  requests[1].resolve("current result");
  await nextMicrotaskTurn();

  assert.deepEqual(committed, ["current result"]);
  fixture.unmount();
});

test("manual forced reload aborts the current request and starts a new one", async () => {
  const requests = [];
  const fixture = createHookFixture(signal => {
    const request = deferred();
    requests.push({ ...request, signal });
    return request.promise;
  });
  await nextMicrotaskTurn();

  const firstRequest = requests[0];
  const forcedReload = fixture.reload();

  assert.equal(firstRequest.signal.aborted, true);
  assert.equal(requests.length, 2);
  requests[1].resolve();
  await forcedReload;
  firstRequest.resolve();
  fixture.unmount();
});

test("hidden pages do not poll, and focus does not revalidate until visible", async () => {
  const calls = [];
  const fixture = createHookFixture(async signal => {
    calls.push(signal);
  });
  await nextMicrotaskTurn();
  assert.equal(calls.length, 1);

  fixture.document.visibilityState = "hidden";
  fixture.intervalCallback();
  fixture.window.dispatchEvent(new Event("focus"));
  fixture.document.dispatchEvent(new Event("visibilitychange"));
  await nextMicrotaskTurn();
  assert.equal(calls.length, 1);

  fixture.document.visibilityState = "visible";
  fixture.document.dispatchEvent(new Event("visibilitychange"));
  await nextMicrotaskTurn();
  assert.equal(calls.length, 2);
  fixture.unmount();
});

test("unmount aborts the active request, removes listeners, and prevents later refreshes", async () => {
  const pending = deferred();
  const calls = [];
  const fixture = createHookFixture(signal => {
    calls.push(signal);
    return pending.promise;
  });
  await nextMicrotaskTurn();
  const activeSignal = calls[0];

  fixture.unmount();
  fixture.window.dispatchEvent(new Event("focus"));
  fixture.document.dispatchEvent(new Event("visibilitychange"));
  fixture.window.dispatchEvent(new Event("issues-cache-invalidated"));
  await nextMicrotaskTurn();

  assert.equal(activeSignal.aborted, true);
  assert.equal(fixture.intervalCleared, true);
  assert.equal(calls.length, 1);
  assert.equal(await fixture.reload(), undefined);
  pending.resolve();
});

test("apiFetch skips cache invalidation only when the caller opts out", async () => {
  const entries = new Map();
  const localStorage = {
    get length() {
      return entries.size;
    },
    key(index) {
      return [...entries.keys()][index] ?? null;
    },
    removeItem(key) {
      entries.delete(key);
    },
  };
  const window = {
    localStorage,
    dispatchEvent() {
      return true;
    },
  };
  const cacheModule = loadTypeScript("src/utils/cache.ts", {
    globals: { window },
  });
  const { IssuesCache } = cacheModule;
  const { apiFetch } = loadTypeScript("src/utils/api-fetch.ts", {
    globals: {
      window,
      process: { env: { NEXT_PUBLIC_API_KEY: "test" } },
      fetch: async () => new Response(null, { status: 200 }),
    },
    mocks: { "@/utils/cache": cacheModule },
  });

  IssuesCache.update("user-a", "USER", [{ id: "issue-1" }], 0, "all-issues");
  await apiFetch("/api/notifications", { method: "PATCH" }, { invalidatePrivateCache: false });
  assert.notEqual(IssuesCache.get("user-a", "USER", "all-issues"), null);

  await apiFetch("/api/issues", { method: "POST" });
  assert.equal(IssuesCache.get("user-a", "USER", "all-issues"), null);
});
