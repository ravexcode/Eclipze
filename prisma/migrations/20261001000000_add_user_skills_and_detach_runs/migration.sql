CREATE TABLE "user_skills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT,
    "source" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_skills_userId_sourceId_key" ON "user_skills"("userId", "sourceId");
CREATE INDEX "user_skills_userId_updatedAt_idx" ON "user_skills"("userId", "updatedAt");

ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_runs" ALTER COLUMN "agentSessionId" DROP NOT NULL;
ALTER TABLE "agent_runs" ADD COLUMN "prompt" TEXT;
ALTER TABLE "agent_runs" DROP CONSTRAINT "agent_runs_agentSessionId_fkey";
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agentSessionId_fkey"
FOREIGN KEY ("agentSessionId") REFERENCES "agent_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
