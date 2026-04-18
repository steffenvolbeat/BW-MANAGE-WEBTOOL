-- CreateEnum
CREATE TYPE "TimelineEntryType" AS ENUM ('STATUS_CHANGE', 'NOTE', 'COVER_LETTER', 'CV_UPDATE', 'ACTIVITY', 'CALENDAR_EVENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "ClassroomEntryType" AS ENUM ('DAY_NOTE', 'DAY_SUMMARY', 'WEEK_SUMMARY', 'RESEARCH');

-- AlterTable
ALTER TABLE "cover_letters" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "application_timelines" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TimelineEntryType" NOT NULL DEFAULT 'MANUAL',
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT,
    "itBereich" TEXT,
    "week" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "noteId" TEXT,
    "coverId" TEXT,
    "eventId" TEXT,
    "activityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "day" INTEGER,
    "type" "ClassroomEntryType" NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "application_timelines_applicationId_idx" ON "application_timelines"("applicationId");

-- CreateIndex
CREATE INDEX "application_timelines_userId_idx" ON "application_timelines"("userId");

-- CreateIndex
CREATE INDEX "classroom_entries_userId_week_idx" ON "classroom_entries"("userId", "week");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_entries_userId_week_day_type_key" ON "classroom_entries"("userId", "week", "day", "type");

-- AddForeignKey
ALTER TABLE "application_timelines" ADD CONSTRAINT "application_timelines_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_timelines" ADD CONSTRAINT "application_timelines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_entries" ADD CONSTRAINT "classroom_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
