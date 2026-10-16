-- CreateEnum
CREATE TYPE "DatabaseProvider" AS ENUM ('SUPABASE', 'PRISMA', 'MONGODB', 'NEON', 'INSFORGE');

-- CreateTable
CREATE TABLE "database_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "DatabaseProvider" NOT NULL,
    "encryptedCredential" TEXT NOT NULL,
    "credentialHint" TEXT,
    "baseUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "database_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "database_connections_userId_provider_key" ON "database_connections"("userId", "provider");

-- CreateIndex
CREATE INDEX "database_connections_userId_idx" ON "database_connections"("userId");

-- AddForeignKey
ALTER TABLE "database_connections" ADD CONSTRAINT "database_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
