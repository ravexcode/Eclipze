const assert = require("node:assert/strict");
const test = require("node:test");
const { loadTypeScript } = require("./helpers/load-typescript.cjs");

const USER_ID = "user-current";
const FOREIGN_USER_ID = "user-foreign";

function makeIssue(id, userId, projectUserId = null) {
  return {
    id,
    userId,
    projectId: projectUserId ? `project-${id}` : null,
    title: `Title ${id}`,
    project: projectUserId ? { userId: projectUserId } : null,
  };
}

function makeNotification(id, issue, readAt = null, userId = USER_ID, createdAt = new Date()) {
  return {
    id,
    userId,
    issueId: issue?.id ?? null,
    type: "ISSUE_STATUS_CHANGED",
    readAt,
    createdAt,
    issue,
  };
}

function matchesWhere(record, where) {
  if (!where) return true;

  for (const [key, value] of Object.entries(where)) {
    if (key === "OR") {
      if (!value.some(clause => matchesWhere(record, clause))) return false;
      continue;
    }

    if (key === "AND") {
      if (!value.every(clause => matchesWhere(record, clause))) return false;
      continue;
    }

    if (key === "issue") {
      if (!record.issue || !matchesWhere(record.issue, value.is)) return false;
      continue;
    }

    if (key === "project") {
      if (!record.project || !matchesWhere(record.project, value.is)) return false;
      continue;
    }

    if (record[key] !== value) return false;
  }

  return true;
}

function createHarness(notifications, currentUser = { id: USER_ID }) {
  const calls = { count: 0, findMany: 0, updateMany: 0 };
  const prisma = {
    notification: {
      async count({ where }) {
        calls.count += 1;
        return notifications.filter(notification => matchesWhere(notification, where)).length;
      },
      async findMany({ where, orderBy, take }) {
        calls.findMany += 1;
        const rows = notifications
          .filter(notification => matchesWhere(notification, where))
          .sort((left, right) => right.createdAt - left.createdAt)
          .slice(0, take);

        return orderBy.createdAt === "desc"
          ? rows.map(({ issue, ...notification }) => ({
            ...notification,
            issue: issue ? { id: issue.id, title: issue.title } : null,
          }))
          : rows;
      },
      async updateMany({ where, data }) {
        calls.updateMany += 1;
        const matching = notifications.filter(notification => matchesWhere(notification, where));
        for (const notification of matching) Object.assign(notification, data);
        return { count: matching.length };
      },
    },
  };

  const route = loadTypeScript("src/app/api/notifications/route.ts", {
    mocks: {
      "@/lib/auth": { getCurrentUser: async () => currentUser },
      "@/lib/prisma": prisma,
    },
  });

  return { route, calls, notifications };
}

function getRequest(path = "/api/notifications") {
  return new Request(`http://localhost${path}`);
}

function patchRequest(body) {
  return new Request("http://localhost/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("GET counts authorized unread history beyond the 50-item list", async () => {
  const notifications = Array.from({ length: 60 }, (_, index) => {
    const createdAt = new Date(Date.UTC(2026, 0, 1) + index * 1_000);
    const isUnread = index < 12;
    return makeNotification(
      `owned-${index}`,
      makeIssue(`issue-${index}`, USER_ID),
      isUnread ? null : new Date(createdAt.getTime() + 1),
      USER_ID,
      createdAt,
    );
  });
  notifications.push(
    makeNotification("foreign-issue", makeIssue("foreign-issue", FOREIGN_USER_ID), null, USER_ID),
    makeNotification("foreign-project", makeIssue("foreign-project", FOREIGN_USER_ID, FOREIGN_USER_ID), null, USER_ID),
    // Project owners can access an issue even when another user requested it.
    makeNotification("project-access", makeIssue("project-access", FOREIGN_USER_ID, USER_ID), null, USER_ID),
  );

  const { route } = createHarness(notifications);
  const response = await route.GET(getRequest());
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(body.notifications.length, 50);
  assert.equal(body.unread, 13);
  assert.equal(body.notifications[0].id, "project-access");
  assert.equal(body.notifications.some(notification => notification.id === "foreign-issue"), false);
  assert.equal(body.notifications.some(notification => notification.id === "foreign-project"), false);
  assert.equal(body.notifications.some(notification => notification.id === "owned-0"), false);
});

test("countOnly returns the authorized unread count without loading notification rows", async () => {
  const notifications = [
    makeNotification("unread-owned", makeIssue("owned", USER_ID)),
    makeNotification("unread-foreign", makeIssue("foreign", FOREIGN_USER_ID)),
    makeNotification("unread-project-owned", makeIssue("project-owned", FOREIGN_USER_ID, USER_ID)),
    makeNotification("unread-without-issue", null),
  ];
  const { route, calls } = createHarness(notifications);

  const response = await route.GET(getRequest("/api/notifications?countOnly=true"));

  assert.deepEqual(await response.json(), { unread: 3 });
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(calls.count, 1);
  assert.equal(calls.findMany, 0);
});

test("PATCH marks one notification only when its issue is currently accessible", async () => {
  const notifications = [
    makeNotification("owned", makeIssue("owned", USER_ID)),
    makeNotification("foreign", makeIssue("foreign", FOREIGN_USER_ID)),
    makeNotification("project-owned", makeIssue("project-owned", FOREIGN_USER_ID, USER_ID)),
  ];
  const { route } = createHarness(notifications);

  const denied = await route.PATCH(patchRequest({ id: "foreign" }));
  const allowed = await route.PATCH(patchRequest({ id: "project-owned" }));

  assert.equal(denied.status, 404);
  assert.equal(notifications.find(notification => notification.id === "foreign").readAt, null);
  assert.equal(allowed.status, 200);
  assert.notEqual(notifications.find(notification => notification.id === "project-owned").readAt, null);
});

test("PATCH all marks only unread notifications whose issue is currently accessible", async () => {
  const notifications = [
    makeNotification("owned", makeIssue("owned", USER_ID)),
    makeNotification("foreign", makeIssue("foreign", FOREIGN_USER_ID)),
    makeNotification("project-owned", makeIssue("project-owned", FOREIGN_USER_ID, USER_ID)),
    makeNotification("without-issue", null),
  ];
  const { route } = createHarness(notifications);

  const response = await route.PATCH(patchRequest({ all: true }));

  assert.equal(response.status, 200);
  assert.notEqual(notifications.find(notification => notification.id === "owned").readAt, null);
  assert.equal(notifications.find(notification => notification.id === "foreign").readAt, null);
  assert.notEqual(notifications.find(notification => notification.id === "project-owned").readAt, null);
  assert.notEqual(notifications.find(notification => notification.id === "without-issue").readAt, null);
});

test("PATCH issueId marks every unread notification for that accessible issue past the list limit", async () => {
  const targetIssue = makeIssue("target-issue", USER_ID);
  const otherIssue = makeIssue("other-issue", USER_ID);
  const notifications = [
    ...Array.from({ length: 60 }, (_, index) => makeNotification(`target-${index}`, targetIssue)),
    makeNotification("target-already-read", targetIssue, new Date("2026-01-01T00:00:00.000Z")),
    makeNotification("other-unread", otherIssue),
  ];
  const { route } = createHarness(notifications);

  const response = await route.PATCH(patchRequest({ issueId: "target-issue" }));

  assert.equal(response.status, 200);
  assert.ok(notifications.slice(0, 60).every(notification => notification.readAt !== null));
  assert.notEqual(notifications[60].readAt, null);
  assert.equal(notifications[61].readAt, null);
});

test("PATCH issueId cannot mark unread notifications for an inaccessible issue", async () => {
  const notifications = [
    makeNotification("foreign-issue", makeIssue("foreign-issue", FOREIGN_USER_ID)),
  ];
  const { route } = createHarness(notifications);

  const response = await route.PATCH(patchRequest({ issueId: "foreign-issue" }));

  assert.equal(response.status, 200);
  assert.equal(notifications[0].readAt, null);
});

test("PATCH rejects empty or ambiguous update targets", async () => {
  const { route, calls } = createHarness([
    makeNotification("owned", makeIssue("owned", USER_ID)),
  ]);

  const emptyIssueId = await route.PATCH(patchRequest({ issueId: "  " }));
  const multipleTargets = await route.PATCH(patchRequest({ id: "owned", issueId: "owned" }));
  const allAndId = await route.PATCH(patchRequest({ all: true, id: "owned" }));
  const allFalse = await route.PATCH(patchRequest({ all: false }));

  assert.equal(emptyIssueId.status, 400);
  assert.equal(multipleTargets.status, 400);
  assert.equal(allAndId.status, 400);
  assert.equal(allFalse.status, 400);
  assert.equal(calls.updateMany, 0);
});

test("GET and PATCH reject unauthenticated requests", async () => {
  const { route, calls } = createHarness([], null);

  const getResponse = await route.GET(getRequest());
  const patchResponse = await route.PATCH(patchRequest({ all: true }));

  assert.equal(getResponse.status, 401);
  assert.equal(patchResponse.status, 401);
  assert.equal(calls.count, 0);
  assert.equal(calls.findMany, 0);
  assert.equal(calls.updateMany, 0);
});
