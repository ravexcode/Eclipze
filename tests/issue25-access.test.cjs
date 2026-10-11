const assert = require("node:assert/strict");
const test = require("node:test");

const { loadTypeScript } = require("./helpers/load-typescript.cjs");

function matchesWhere(record, where) {
  if (!record) return false;
  if (!where) return true;
  if (where.AND && !where.AND.every(clause => matchesWhere(record, clause))) return false;
  if (where.OR && !where.OR.some(clause => matchesWhere(record, clause))) return false;
  if (where.id !== undefined && record.id !== where.id) return false;
  if (where.userId !== undefined && record.userId !== where.userId) return false;
  if (where.project?.is && !matchesWhere(record.project, where.project.is)) return false;
  return true;
}

function makeIssue({ id, userId, projectId = null, projectOwnerId = null }) {
  return {
    id,
    userId,
    projectId,
    project: projectId ? { id: projectId, userId: projectOwnerId } : null,
    user: { id: userId, username: userId, email: `${userId}@example.test` },
    messages: [],
    title: `Issue ${id}`,
    description: "Private issue details",
    type: "SUPPORT",
    priority: "MEDIUM",
    status: "OPEN",
    resolvedAt: null,
    closedAt: null,
    lastActivityAt: new Date("2026-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

function makeHarness({ user, issues = [] }) {
  const state = {
    issues: structuredClone(issues),
    messages: [],
    notifications: [],
    users: [
      { id: "issue-owner", role: "USER" },
      { id: "project-owner", role: "DEVELOPER" },
      { id: "unrelated-developer", role: "DEVELOPER" },
      { id: "another-user", role: "USER" },
    ],
    calls: [],
    transactionCount: 0,
  };

  const issueApi = {
    findMany: async ({ where } = {}) => {
      state.calls.push(["issue.findMany", where]);
      return state.issues.filter(issue => matchesWhere(issue, where));
    },
    findFirst: async ({ where } = {}) => {
      state.calls.push(["issue.findFirst", where]);
      return state.issues.find(issue => matchesWhere(issue, where)) ?? null;
    },
    create: async ({ data }) => {
      const issue = makeIssue({ id: "created-issue", userId: data.userId, projectId: data.projectId });
      Object.assign(issue, data);
      state.issues.push(issue);
      return issue;
    },
    updateMany: async ({ where, data }) => {
      state.calls.push(["issue.updateMany", where, data]);
      const issue = state.issues.find(candidate => matchesWhere(candidate, where));
      if (!issue) return { count: 0 };
      Object.assign(issue, data);
      return { count: 1 };
    },
  };

  const prisma = {
    issue: issueApi,
    project: {
      create: async ({ data }) => ({ id: "new-project", ...data }),
      findFirst: async ({ where }) => where.userId === user?.id
        ? { id: where.id, userId: where.userId }
        : null,
    },
    issueMessage: {
      create: async ({ data }) => {
        const message = {
          id: `message-${state.messages.length + 1}`,
          ...data,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        };
        state.messages.push(message);
        return message;
      },
    },
    notification: {
      createMany: async ({ data }) => {
        state.notifications.push(...data);
        return { count: data.length };
      },
    },
    user: {
      findMany: async ({ where, select }) => {
        state.calls.push(["user.findMany", where, select]);
        if (where?.role) return state.users.filter(item => item.role === where.role && item.id !== where.id?.not);
        return state.users;
      },
      count: async ({ where }) => state.users.filter(item => !where || item.role === where.role).length,
      updateMany: async () => ({ count: 1 }),
    },
    $transaction: async callback => {
      state.transactionCount += 1;
      return callback(prisma);
    },
  };

  const routeMocks = {
    "@/lib/auth": { getCurrentUser: async () => user },
    "@/lib/prisma": prisma,
    "@/lib/workspace": {
      serializeIssue: issue => ({
        id: issue.id,
        userId: issue.userId,
        projectId: issue.projectId,
        title: issue.title,
        priority: issue.priority,
        status: issue.status,
      }),
      serializeProject: project => project,
    },
  };

  const listRoute = loadTypeScript("src/app/api/issues/route.ts", { mocks: routeMocks });
  const detailRoute = loadTypeScript("src/app/api/issues/[id]/route.ts", { mocks: routeMocks });
  const messageRoute = loadTypeScript("src/app/api/issues/[id]/messages/route.ts", { mocks: routeMocks });
  const usersRoute = loadTypeScript("src/app/api/developer/users/route.ts", { mocks: routeMocks });
  const userRoleRoute = loadTypeScript("src/app/api/developer/users/[id]/role/route.ts", { mocks: routeMocks });

  const projectsRoute = loadTypeScript("src/app/api/projects/route.ts", { mocks: routeMocks });
  return { state, prisma, listRoute, detailRoute, messageRoute, usersRoute, userRoleRoute, projectsRoute };
}

function request(body) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function json(response) {
  return response.json();
}

const privateIssue = makeIssue({
  id: "private-issue",
  userId: "issue-owner",
  projectId: "private-project",
  projectOwnerId: "project-owner",
});
const unrelatedIssue = makeIssue({
  id: "unrelated-issue",
  userId: "another-user",
  projectId: "another-project",
  projectOwnerId: "another-user",
});

for (const role of ["USER", "DEVELOPER"]) {
  test(`${role} cannot list, read, update, or message an unrelated private issue`, async () => {
    const harness = makeHarness({
      user: { id: "unrelated-developer", role },
      issues: [privateIssue, unrelatedIssue],
    });

    const listed = await harness.listRoute.GET();
    assert.equal(listed.status, 200);
    assert.deepEqual((await json(listed)).issues.map(issue => issue.id), []);

    const context = { params: Promise.resolve({ id: privateIssue.id }) };
    assert.equal((await harness.detailRoute.GET(new Request("http://localhost"), context)).status, 404);
    assert.equal((await harness.detailRoute.PATCH(request({ status: "CLOSED" }), context)).status, 404);
    assert.equal((await harness.detailRoute.PATCH(request({ title: "Unauthorized edit" }), context)).status, 404);
    assert.equal((await harness.messageRoute.POST(request({ body: "hello" }), context)).status, 404);
    assert.equal(harness.state.messages.length, 0);
    assert.equal(harness.state.notifications.length, 0);
  });
}

test("Developer can access an issue they own even when its project belongs to someone else", async () => {
  const harness = makeHarness({
    user: { id: "issue-owner", role: "DEVELOPER" },
    issues: [privateIssue],
  });

  const listed = await harness.listRoute.GET();
  assert.deepEqual((await json(listed)).issues.map(issue => issue.id), [privateIssue.id]);
  const detail = await harness.detailRoute.GET(new Request("http://localhost"), {
    params: Promise.resolve({ id: privateIssue.id }),
  });
  assert.equal(detail.status, 200);
});

test("USER can access their own issue", async () => {
  const harness = makeHarness({
    user: { id: "issue-owner", role: "USER" },
    issues: [privateIssue],
  });

  const listed = await harness.listRoute.GET();
  assert.deepEqual((await json(listed)).issues.map(issue => issue.id), [privateIssue.id]);
  const detail = await harness.detailRoute.GET(new Request("http://localhost"), {
    params: Promise.resolve({ id: privateIssue.id }),
  });
  assert.equal(detail.status, 200);
});

test("Developer can access a project-owned issue with a different requester", async () => {
  const harness = makeHarness({
    user: { id: "project-owner", role: "DEVELOPER" },
    issues: [privateIssue],
  });

  const listed = await harness.listRoute.GET();
  assert.deepEqual((await json(listed)).issues.map(issue => issue.id), [privateIssue.id]);
  const detail = await harness.detailRoute.GET(new Request("http://localhost"), {
    params: Promise.resolve({ id: privateIssue.id }),
  });
  assert.equal(detail.status, 200);
});

test("Developer can update an authorized issue while project ownership grants access", async () => {
  const harness = makeHarness({
    user: { id: "project-owner", role: "DEVELOPER" },
    issues: [privateIssue],
  });
  const context = { params: Promise.resolve({ id: privateIssue.id }) };

  const changed = await harness.detailRoute.PATCH(request({ status: "IN_PROGRESS", priority: "HIGH" }), context);
  assert.equal(changed.status, 200);
  assert.equal(harness.state.issues[0].status, "IN_PROGRESS");
  assert.equal(harness.state.issues[0].priority, "HIGH");

  const renamed = await harness.detailRoute.PATCH(request({ title: "Changed title" }), context);
  assert.equal(renamed.status, 200);
  assert.equal(harness.state.issues[0].title, "Changed title");
});

test("Developer user administration endpoints do not grant global user access", async () => {
  for (const role of ["USER", "DEVELOPER"]) {
    const harness = makeHarness({ user: { id: "actor", role } });
    assert.equal((await harness.usersRoute.GET(new Request("http://localhost/api/developer/users"))).status, 403);
    assert.equal((await harness.usersRoute.PATCH(request({ userId: "another-user", role: "DEVELOPER" }))).status, 403);
    assert.equal((await harness.userRoleRoute.PATCH(request({ role: "DEVELOPER" }), {
      params: Promise.resolve({ id: "another-user" }),
    })).status, 403);
    assert.equal(harness.state.calls.some(([method]) => method.startsWith("user.")), false);
  }
});

test("unauthenticated issue routes return 401 before reading or mutating private data", async () => {
  const harness = makeHarness({ user: null, issues: [privateIssue] });

  assert.equal((await harness.listRoute.GET()).status, 401);
  const context = { params: Promise.resolve({ id: privateIssue.id }) };
  assert.equal((await harness.detailRoute.GET(new Request("http://localhost"), context)).status, 401);
  assert.equal((await harness.detailRoute.PATCH(request({ status: "CLOSED" }), context)).status, 401);
  assert.equal((await harness.messageRoute.POST(request({ body: "hello" }), context)).status, 401);
  assert.equal((await harness.usersRoute.GET(new Request("http://localhost/api/developer/users"))).status, 401);
  assert.equal((await harness.usersRoute.PATCH(request({ userId: "another-user", role: "DEVELOPER" }))).status, 401);
  assert.equal((await harness.userRoleRoute.PATCH(request({ role: "DEVELOPER" }), {
    params: Promise.resolve({ id: "another-user" }),
  })).status, 401);
  assert.equal(harness.state.calls.length, 0);
});

test("issue creation and messaging notify only authorized issue participants", async () => {
  const harness = makeHarness({ user: { id: "project-owner", role: "DEVELOPER" } });
  const created = await harness.listRoute.POST(request({
    title: "Private project issue",
    description: "Visible to its owners",
    projectId: "private-project",
  }));

  assert.equal(created.status, 201);
  assert.deepEqual(harness.state.notifications, []);

  const issue = makeIssue({
    id: "mismatched-issue",
    userId: "issue-owner",
    projectId: "private-project",
    projectOwnerId: "project-owner",
  });
  harness.state.issues.push(issue);
  harness.state.notifications.length = 0;
  const message = await harness.messageRoute.POST(request({ body: "Private reply" }), {
    params: Promise.resolve({ id: issue.id }),
  });

  assert.equal(message.status, 201);
  assert.deepEqual(harness.state.notifications.map(item => item.userId), ["issue-owner"]);
  assert.equal(harness.state.notifications.some(item => item.userId === "unrelated-developer"), false);
});

test("message transaction returns 404 and writes nothing when the guarded issue update loses access", async () => {
  const issue = makeIssue({
    id: "racing-issue",
    userId: "issue-owner",
    projectId: "private-project",
    projectOwnerId: "project-owner",
  });
  const harness = makeHarness({ user: { id: "project-owner", role: "DEVELOPER" }, issues: [issue] });
  harness.prisma.issue.updateMany = async () => ({ count: 0 });

  const response = await harness.messageRoute.POST(request({ body: "Late reply" }), {
    params: Promise.resolve({ id: issue.id }),
  });

  assert.equal(response.status, 404);
  assert.equal(harness.state.messages.length, 0);
  assert.equal(harness.state.notifications.length, 0);
  assert.equal(harness.state.transactionCount, 1);
});

test("issue PATCH returns 404 without notifications when project access is revoked before its guarded write", async () => {
  const issue = makeIssue({
    id: "revoked-project-issue",
    userId: "issue-owner",
    projectId: "private-project",
    projectOwnerId: "project-owner",
  });
  const harness = makeHarness({ user: { id: "project-owner", role: "DEVELOPER" }, issues: [issue] });
  harness.prisma.issue.updateMany = async () => ({ count: 0 });

  const response = await harness.detailRoute.PATCH(request({ status: "CLOSED" }), {
    params: Promise.resolve({ id: issue.id }),
  });

  assert.equal(response.status, 404);
  assert.equal(harness.state.issues[0].status, "OPEN");
  assert.equal(harness.state.notifications.length, 0);
});

for (const role of ["USER", "DEVELOPER"]) {
  test(`${role} creates projects under their own account`, async () => {
    const harness = makeHarness({ user: { id: "actor", role } });
    const response = await harness.projectsRoute.POST(request({ name: "Private project", userId: "foreign-account" }));
    assert.equal(response.status, 201);
    assert.equal((await response.json()).project.userId, "actor");
  });

  test(`${role} cannot access an unrelated issue without a project`, async () => {
    const issue = makeIssue({ id: "standalone", userId: "foreign-account" });
    const harness = makeHarness({ user: { id: "actor", role }, issues: [issue] });
    assert.deepEqual((await (await harness.listRoute.GET()).json()).issues, []);
    const context = { params: Promise.resolve({ id: issue.id }) };
    assert.equal((await harness.detailRoute.GET(new Request("http://localhost"), context)).status, 404);
    assert.equal((await harness.messageRoute.POST(request({ body: "Unauthorized" }), context)).status, 404);
  });
}

test("Client retains content editing but cannot change status or priority", async () => {
  const issue = makeIssue({ id: "owned", userId: "actor" });
  const harness = makeHarness({ user: { id: "actor", role: "USER" }, issues: [issue] });
  const context = { params: Promise.resolve({ id: issue.id }) };
  assert.equal((await harness.detailRoute.PATCH(request({ title: "Updated" }), context)).status, 200);
  assert.equal((await harness.detailRoute.PATCH(request({ status: "CLOSED" }), context)).status, 403);
  assert.equal((await harness.detailRoute.PATCH(request({ priority: "HIGH" }), context)).status, 403);
  assert.equal(harness.state.issues[0].title, "Updated");
  assert.equal(harness.state.issues[0].status, "OPEN");
});
