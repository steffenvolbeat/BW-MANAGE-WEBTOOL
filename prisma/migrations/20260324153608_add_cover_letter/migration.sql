-- AlterTable: add coverLetter and itBereich columns to applications
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "coverLetter" TEXT;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "itBereich" TEXT;
