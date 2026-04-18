-- AlterTable
ALTER TABLE "application_timelines" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "timeline_comments" (
    "id" TEXT NOT NULL,
    "timelineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_shares" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "companyFilter" TEXT,
    "typeFilter" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "timeline_comments_timelineId_idx" ON "timeline_comments"("timelineId");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_shares_token_key" ON "timeline_shares"("token");

-- CreateIndex
CREATE INDEX "timeline_shares_userId_idx" ON "timeline_shares"("userId");

-- AddForeignKey
ALTER TABLE "timeline_comments" ADD CONSTRAINT "timeline_comments_timelineId_fkey" FOREIGN KEY ("timelineId") REFERENCES "application_timelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_comments" ADD CONSTRAINT "timeline_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_shares" ADD CONSTRAINT "timeline_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
