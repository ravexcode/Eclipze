CREATE TYPE "AiProvider" AS ENUM ('CLAUDE', 'GPT', 'OPENROUTER', 'ZAI', 'XAI', 'GPT_SUBSCRIPTION');

CREATE TABLE "ai_provider_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AiProvider" NOT NULL,
    "encryptedApiKey" TEXT,
    "keyHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_provider_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_provider_connections_userId_provider_key" ON "ai_provider_connections"("userId", "provider");
CREATE INDEX "ai_provider_connections_userId_idx" ON "ai_provider_connections"("userId");

ALTER TABLE "ai_provider_connections" ADD CONSTRAINT "ai_provider_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
