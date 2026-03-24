-- CreateEnum
CREATE TYPE "ModeratorStatus" AS ENUM ('NEW', 'ACTIVE');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('PENDING', 'SAFE', 'FLAGGED', 'ESCALATED');

-- CreateTable
CREATE TABLE "Moderator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "hoursPerWeek" INTEGER NOT NULL,
    "status" "ModeratorStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Moderator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "status" "ContentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationDecision" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "decision" "ContentStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Moderator_email_key" ON "Moderator"("email");

-- CreateIndex
CREATE INDEX "ModerationDecision_contentId_idx" ON "ModerationDecision"("contentId");

-- CreateIndex
CREATE INDEX "ModerationDecision_moderatorId_idx" ON "ModerationDecision"("moderatorId");

-- AddForeignKey
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "ModerationDecision_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "ModerationDecision_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "Moderator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
