-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'PLUS', 'MAX', 'TEAM');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "plan" "UserPlan" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "erd_diagrams" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "erd_diagrams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "erd_diagrams_projectId_key" ON "erd_diagrams"("projectId");

-- CreateIndex
CREATE INDEX "erd_diagrams_userId_idx" ON "erd_diagrams"("userId");

-- AddForeignKey
ALTER TABLE "erd_diagrams" ADD CONSTRAINT "erd_diagrams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erd_diagrams" ADD CONSTRAINT "erd_diagrams_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
