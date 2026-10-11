const assert = require("node:assert/strict");
const test = require("node:test");
const { loadTypeScript } = require("./helpers/load-typescript.cjs");

const { appendRunEventTransaction } = loadTypeScript("src/lib/agent-run-events.ts");

function createDatabase({ runIds = ["run-1"], beforeCreate = async () => {} } = {}) {
  const events = [];
  const existingRunIds = new Set(runIds);
  const runLocks = new Map();
  const isolationLevels = [];
  let nextId = 1;
  let createFailure = null;

  function acquireRunLock(runId) {
    const currentLock = runLocks.get(runId) ?? Promise.resolve();
    let release;
    const nextLock = new Promise(resolve => {
      release = resolve;
    });
    runLocks.set(runId, currentLock.then(() => nextLock));

    return currentLock.then(() => release);
  }

  const database = {
    events,
    isolationLevels,
    setCreateFailure(error) {
      createFailure = error;
    },
    async $transaction(callback, options) {
      isolationLevels.push(options?.isolationLevel);
      const pendingEvents = [];
      const releases = [];
      const transaction = {
        async $queryRaw(strings, ...values) {
          const sql = strings.reduce(
            (result, part, index) => `${result}${part}${index < values.length ? `$${index + 1}` : ""}`,
            "",
          );
          assert.match(sql, /SELECT\s+id\s+FROM\s+agent_runs\s+WHERE\s+id\s+=\s+\$1\s+FOR\s+UPDATE/i);
          assert.equal(values.length, 1, "run id must be bound as a parameter");

          const [release] = await Promise.all([acquireRunLock(values[0])]);
          releases.push(release);
          return existingRunIds.has(values[0]) ? [{ id: values[0] }] : [];
        },
        agentRunEvent: {
          async findFirst({ where }) {
            const latest = [...events, ...pendingEvents]
              .filter(event => event.runId === where.runId)
              .sort((left, right) => right.sequence - left.sequence)[0];
            return latest ? { sequence: latest.sequence } : null;
          },
          async create({ data }) {
            await beforeCreate(data);

            const duplicate = [...events, ...pendingEvents].some(
              event => event.runId === data.runId && event.sequence === data.sequence,
            );
            if (duplicate) {
              throw new Error("Unique constraint failed on (runId, sequence)");
            }

            const created = { id: `event-${nextId++}`, ...data };
            pendingEvents.push(created);

            if (createFailure) {
              throw createFailure;
            }

            return created;
          },
        },
      };

      try {
        const result = await callback(transaction);

        for (const pendingEvent of pendingEvents) {
          const duplicate = events.some(
            event => event.runId === pendingEvent.runId && event.sequence === pendingEvent.sequence,
          );
          if (duplicate) {
            throw new Error("Unique constraint failed on (runId, sequence)");
          }
        }

        events.push(...pendingEvents);
        return result;
      } finally {
        for (const release of releases.reverse()) {
          release();
        }
      }
    },
  };

  return database;
}

test("concurrent appends serialize on the parameterized parent-run lock", async () => {
  const database = createDatabase();
  const count = 80;

  await Promise.all(
    Array.from({ length: count }, (_, index) =>
      appendRunEventTransaction(database, "run-1", {
        type: "OUTPUT",
        message: `output-${index}`,
      }),
    ),
  );

  assert.deepEqual(
    database.events.map(event => event.sequence),
    Array.from({ length: count }, (_, index) => index + 1),
  );
  assert.equal(new Set(database.events.map(event => event.sequence)).size, count);
  assert.deepEqual(database.isolationLevels, Array(count).fill("ReadCommitted"));
});

test("unlocked concurrent writers collide on the unique run sequence", async () => {
  const database = createDatabase();

  async function appendWithoutRunLock(message) {
    return database.$transaction(async transaction => {
      const previous = await transaction.agentRunEvent.findFirst({
        where: { runId: "run-1" },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      });

      return transaction.agentRunEvent.create({
        data: {
          runId: "run-1",
          sequence: (previous?.sequence ?? 0) + 1,
          type: "OUTPUT",
          message,
        },
      });
    });
  }

  const results = await Promise.allSettled([
    appendWithoutRunLock("writer one"),
    appendWithoutRunLock("writer two"),
  ]);

  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(results.filter(result => result.status === "rejected").length, 1);
  assert.equal(database.events.length, 1);
});

test("a failed append propagates its error and rolls back only its pending event", async () => {
  const database = createDatabase();
  const committed = await appendRunEventTransaction(database, "run-1", {
    type: "SYSTEM",
    message: "committed before failure",
  });
  const expectedError = new Error("insert failed");
  database.setCreateFailure(expectedError);

  await assert.rejects(
    appendRunEventTransaction(database, "run-1", {
      type: "ERROR",
      message: "failed output",
    }),
    error => error === expectedError,
  );
  assert.deepEqual(database.events, [committed]);
});

test("a missing parent run fails before attempting to append", async () => {
  const database = createDatabase({ runIds: [] });

  await assert.rejects(
    appendRunEventTransaction(database, "missing-run", {
      type: "SYSTEM",
      message: "queued",
    }),
    /Agent run missing-run was not found/,
  );
  assert.deepEqual(database.events, []);
});

test("events on different runs do not block each other", async () => {
  let releaseFirstRun;
  const firstRunIsBlocked = new Promise(resolve => {
    releaseFirstRun = resolve;
  });
  let signalFirstRunBlocked;
  const firstRunBlocked = new Promise(resolve => {
    signalFirstRunBlocked = resolve;
  });
  const database = createDatabase({
    runIds: ["run-1", "run-2"],
    beforeCreate: async data => {
      if (data.runId === "run-1") {
        signalFirstRunBlocked();
        await firstRunIsBlocked;
      }
    },
  });

  const firstRunWrite = appendRunEventTransaction(database, "run-1", {
    type: "OUTPUT",
    message: "blocked run",
  });
  await firstRunBlocked;

  const secondRunWrite = await Promise.race([
    appendRunEventTransaction(database, "run-2", {
      type: "OUTPUT",
      message: "independent run",
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("other run was blocked")), 100)),
  ]);

  releaseFirstRun();
  await firstRunWrite;
  assert.equal(secondRunWrite.runId, "run-2");
});

test("event sequences support ascending incremental reads after a cursor", async () => {
  const database = createDatabase();

  for (let index = 1; index <= 5; index += 1) {
    await appendRunEventTransaction(database, "run-1", {
      type: "OUTPUT",
      message: `output-${index}`,
    });
  }

  const after = 2;
  const incrementalEvents = database.events
    .filter(event => event.sequence > after)
    .sort((left, right) => left.sequence - right.sequence)
    .slice(0, 100);

  assert.deepEqual(
    incrementalEvents.map(event => event.sequence),
    [3, 4, 5],
  );
});

test("event message output remains bounded to 8,000 characters", async () => {
  const database = createDatabase();
  const event = await appendRunEventTransaction(database, "run-1", {
    type: "OUTPUT",
    message: "x".repeat(8_100),
  });

  assert.equal(event.message.length, 8_000);
});
