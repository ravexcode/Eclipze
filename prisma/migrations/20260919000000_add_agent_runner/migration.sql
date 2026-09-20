CREATE TYPE "WorkspaceRepositoryProvider" AS ENUM ('GITHUB', 'GITLAB', 'BITBUCKET', 'OTHER');
CREATE TYPE "WorkspaceRepositoryStatus" AS ENUM ('CONNECTED', 'UNAVAILABLE');
CREATE TYPE "AgentRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'BLOCKED');
CREATE TYPE "AgentRunEventType" AS ENUM ('SYSTEM', 'COMMAND', 'OUTPUT', 'ERROR', 'RESULT');

CREATE TABLE "workspace_repositories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "provider" "WorkspaceRepositoryProvider" NOT NULL,
    "repositoryUrl" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "status" "WorkspaceRepositoryStatus" NOT NULL DEFAULT 'CONNECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_repositories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_skill_selections" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "agent_skill_selections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentSessionId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'QUEUED',
    "model" TEXT NOT NULL,
    "commandKey" TEXT NOT NULL,
    "instructionsDigest" TEXT NOT NULL,
    "skillSnapshot" JSONB NOT NULL,
    "workspaceKey" TEXT NOT NULL,
    "errorCode" TEXT,
    "resultSummary" TEXT,
    "cancelRequestedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_run_events" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "AgentRunEventType" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_run_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_repositories_userId_repositoryUrl_key" ON "workspace_repositories"("userId", "repositoryUrl");
CREATE INDEX "workspace_repositories_userId_updatedAt_idx" ON "workspace_repositories"("userId", "updatedAt");
CREATE INDEX "workspace_repositories_projectId_idx" ON "workspace_repositories"("projectId");
CREATE UNIQUE INDEX "agent_skill_selections_agentId_slug_key" ON "agent_skill_selections"("agentId", "slug");
CREATE INDEX "agent_skill_selections_agentId_updatedAt_idx" ON "agent_skill_selections"("agentId", "updatedAt");
CREATE UNIQUE INDEX "agent_runs_workspaceKey_key" ON "agent_runs"("workspaceKey");
CREATE INDEX "agent_runs_userId_createdAt_idx" ON "agent_runs"("userId", "createdAt");
CREATE INDEX "agent_runs_agentSessionId_createdAt_idx" ON "agent_runs"("agentSessionId", "createdAt");
CREATE INDEX "agent_runs_repositoryId_idx" ON "agent_runs"("repositoryId");
CREATE INDEX "agent_runs_status_updatedAt_idx" ON "agent_runs"("status", "updatedAt");
CREATE UNIQUE INDEX "agent_run_events_runId_sequence_key" ON "agent_run_events"("runId", "sequence");
CREATE INDEX "agent_run_events_runId_createdAt_idx" ON "agent_run_events"("runId", "createdAt");

ALTER TABLE "workspace_repositories" ADD CONSTRAINT "workspace_repositories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_repositories" ADD CONSTRAINT "workspace_repositories_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_skill_selections" ADD CONSTRAINT "agent_skill_selections_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agentSessionId_fkey" FOREIGN KEY ("agentSessionId") REFERENCES "agent_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "workspace_repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_run_events" ADD CONSTRAINT "agent_run_events_runId_fkey" FOREIGN KEY ("runId") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
