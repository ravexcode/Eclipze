-- AlterEnum
ALTER TYPE "AiProvider" ADD VALUE 'MCP';

-- AlterTable
ALTER TABLE "agent_runs" ADD COLUMN     "mcpConnectionId" TEXT;

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "mcpConnectionId" TEXT;

-- CreateTable
CREATE TABLE "mcp_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "encryptedToken" TEXT,
    "toolName" TEXT NOT NULL DEFAULT 'codex',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcp_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mcp_connections_userId_idx" ON "mcp_connections"("userId");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_mcpConnectionId_fkey" FOREIGN KEY ("mcpConnectionId") REFERENCES "mcp_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_mcpConnectionId_fkey" FOREIGN KEY ("mcpConnectionId") REFERENCES "mcp_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcp_connections" ADD CONSTRAINT "mcp_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
