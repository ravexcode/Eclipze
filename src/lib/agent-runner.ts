import "server-only";

import { createHash } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

import { isSafeWorkspacePath } from "@/lib/workspace-repository";

export const RUNNER_LIMITS = {
  timeoutMs: 60_000,
  maxOutputBytes: 64 * 1024,
  killGraceMs: 1_000,
} as const;

export const ALLOWED_COMMANDS = {
  "git-status": { executable: "git", args: ["status", "--short"] },
  "git-diff-stat": { executable: "git", args: ["diff", "--stat"] },
  "git-rev-parse": { executable: "git", args: ["rev-parse", "--is-inside-work-tree"] },
  "pnpm-test": { executable: "pnpm", args: ["test"] },
  "pnpm-build": { executable: "pnpm", args: ["build"] },
  "pnpm-typecheck": { executable: "pnpm", args: ["typecheck"] },
  "npm-test": { executable: "npm", args: ["test"] },
  "npm-build": { executable: "npm", args: ["run", "build"] },
  "npm-typecheck": { executable: "npm", args: ["run", "typecheck"] },
  "pytest": { executable: "pytest", args: [] },
  "go-test": { executable: "go", args: ["test", "./..."] },
} as const;

export type AllowedCommand = keyof typeof ALLOWED_COMMANDS;

export type RunnerEvent = {
  type: "SYSTEM" | "COMMAND" | "OUTPUT" | "ERROR" | "RESULT";
  message: string;
  metadata?: Record<string, string | number | boolean>;
};

export type RunnerResult = {
  status: "SUCCEEDED" | "FAILED" | "CANCELLED";
  exitCode: number | null;
  errorCode: string | null;
  outputBytes: number;
};

const activeProcesses = new Map<string, ChildProcessWithoutNullStreams>();

export function createInstructionsDigest(instructions: string) {
  return createHash("sha256").update(instructions).digest("hex");
}

export function resolveAllowedCommand(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const command = value.trim() as AllowedCommand;
  return Object.hasOwn(ALLOWED_COMMANDS, command) ? { key: command, spec: ALLOWED_COMMANDS[command] } : null;
}

function getWorkspaceRoot() {
  const configuredRoot = process.env.AGENT_WORKSPACE_ROOT;

  if (configuredRoot && isAbsolute(configuredRoot)) {
    return resolve(configuredRoot);
  }

  return join(tmpdir(), "eclipze-agent-workspaces");
}

function getWorkspacePath(userId: string, runId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(userId) || !/^[a-zA-Z0-9_-]+$/.test(runId)) {
    throw new Error("Invalid workspace identity.");
  }

  return join(getWorkspaceRoot(), userId, runId);
}

export async function createRunWorkspace(userId: string, runId: string) {
  const workspacePath = getWorkspacePath(userId, runId);
  await mkdir(workspacePath, { recursive: true, mode: 0o700 });
  await mkdir(join(workspacePath, "tmp"), { recursive: true, mode: 0o700 });
  return workspacePath;
}

export async function cleanupRunWorkspace(userId: string, runId: string) {
  const root = getWorkspaceRoot();
  const workspacePath = getWorkspacePath(userId, runId);

  if (!isSafeWorkspacePath(root, workspacePath) || dirname(workspacePath) !== join(root, userId)) {
    throw new Error("Refusing to clean an unsafe workspace path.");
  }

  await rm(workspacePath, { recursive: true, force: true });
}

export function sanitizeRunnerOutput(value: string) {
  return value
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, "[REDACTED_SECRET]")
    .replace(/gh[pousr]_[A-Za-z0-9_]{8,}/g, "[REDACTED_SECRET]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED_SECRET]")
    .replace(/(api[_-]?key|token|secret|password)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED_SECRET]");
}

function createRunnerEnvironment(workspacePath: string) {
  return {
    PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
    HOME: workspacePath,
    LANG: "C",
    NODE_ENV: "production",
    TMPDIR: join(workspacePath, "tmp"),
  } as NodeJS.ProcessEnv;
}

function terminateProcess(child: ChildProcessWithoutNullStreams) {
  if (!child.killed) {
    child.kill("SIGTERM");
  }

  setTimeout(() => {
    if (!child.killed) {
      child.kill("SIGKILL");
    }
  }, RUNNER_LIMITS.killGraceMs).unref();
}

export async function runAllowedCommand(input: {
  runId: string;
  workspacePath: string;
  command: AllowedCommand;
  onEvent(event: RunnerEvent): Promise<void> | void;
}) {
  const root = getWorkspaceRoot();

  if (!isSafeWorkspacePath(root, input.workspacePath)) {
    throw new Error("Workspace path is outside the server workspace root.");
  }

  const command = ALLOWED_COMMANDS[input.command];
  const commandLabel = [command.executable, ...command.args].join(" ");

  await input.onEvent({ type: "COMMAND", message: commandLabel });

  return new Promise<RunnerResult>(resolveResult => {
    const child = spawn(command.executable, command.args, {
      cwd: input.workspacePath,
      env: createRunnerEnvironment(input.workspacePath),
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    }) as unknown as ChildProcessWithoutNullStreams;
    let outputBytes = 0;
    let timedOut = false;
    let cancelled = false;
    let settled = false;

    activeProcesses.set(input.runId, child);

    const finish = (result: RunnerResult) => {
      if (settled) {
        return;
      }

      settled = true;
      activeProcesses.delete(input.runId);
      resolveResult(result);
    };

    const appendOutput = (type: "OUTPUT" | "ERROR", chunk: Buffer) => {
      if (settled) {
        return;
      }

      outputBytes += chunk.byteLength;
      const remainingBytes = RUNNER_LIMITS.maxOutputBytes - (outputBytes - chunk.byteLength);
      const safeChunk = chunk.subarray(0, Math.max(0, remainingBytes)).toString("utf8");
      void input.onEvent({ type, message: sanitizeRunnerOutput(safeChunk) });

      if (outputBytes > RUNNER_LIMITS.maxOutputBytes) {
        void input.onEvent({ type: "ERROR", message: "Runner output limit exceeded." });
        terminateProcess(child);
      }
    };

    child.stdout.on("data", chunk => appendOutput("OUTPUT", chunk));
    child.stderr.on("data", chunk => appendOutput("ERROR", chunk));
    child.on("error", error => {
      void input.onEvent({ type: "ERROR", message: sanitizeRunnerOutput(error.message) });
      finish({ status: "FAILED", exitCode: null, errorCode: "PROCESS_ERROR", outputBytes });
    });
    child.on("close", code => {
      const errorCode = timedOut
        ? "TIMEOUT"
        : outputBytes > RUNNER_LIMITS.maxOutputBytes
          ? "OUTPUT_LIMIT_EXCEEDED"
          : cancelled
            ? "CANCELLED"
            : code === 0
              ? null
              : "COMMAND_FAILED";

      const status = timedOut || cancelled
        ? "CANCELLED"
        : code === 0 && !errorCode
          ? "SUCCEEDED"
          : "FAILED";

      finish({ status, exitCode: code, errorCode, outputBytes });
    });

    setTimeout(() => {
      if (!settled) {
        timedOut = true;
        void input.onEvent({ type: "ERROR", message: "Runner timeout exceeded." });
        terminateProcess(child);
      }
    }, RUNNER_LIMITS.timeoutMs).unref();

    (child as ChildProcessWithoutNullStreams & { cancel?: () => void }).cancel = () => {
      cancelled = true;
      terminateProcess(child);
    };
  });
}

export function cancelCommandForRun(runId: string) {
  const child = activeProcesses.get(runId) as (ChildProcessWithoutNullStreams & { cancel?: () => void }) | undefined;

  if (!child) {
    return false;
  }

  child.cancel?.();
  return true;
}

export function getRunnerMaterializationError() {
  return {
    code: "REPOSITORY_MATERIALIZATION_UNAVAILABLE",
    message: "Repository provider materialization is not configured on this server.",
  } as const;
}
