/*
  Warnings:

  - You are about to drop the column `alg` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `checksum` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `ciphertext` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `isEncrypted` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `iv` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `keyHint` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `wrappedKey` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `piiTags` on the `kanban_cards` table. All the data in the column will be lost.
  - You are about to drop the column `redacted` on the `kanban_cards` table. All the data in the column will be lost.
  - You are about to drop the column `sensitivity` on the `kanban_cards` table. All the data in the column will be lost.
  - You are about to drop the column `alg` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `ciphertext` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `isEncrypted` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `iv` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `keyHint` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `wrappedKey` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `lastLogin` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "InterviewSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABORTED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('EMPLOYMENT', 'FREELANCE', 'NDA', 'SERVICE', 'CONSULTING', 'OTHER');

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "alg",
DROP COLUMN "checksum",
DROP COLUMN "ciphertext",
DROP COLUMN "isEncrypted",
DROP COLUMN "iv",
DROP COLUMN "keyHint",
DROP COLUMN "wrappedKey";

-- AlterTable
ALTER TABLE "kanban_cards" DROP COLUMN "piiTags",
DROP COLUMN "redacted",
DROP COLUMN "sensitivity";

-- AlterTable
ALTER TABLE "notes" DROP COLUMN "alg",
DROP COLUMN "ciphertext",
DROP COLUMN "isEncrypted",
DROP COLUMN "iv",
DROP COLUMN "keyHint",
DROP COLUMN "wrappedKey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "lastLogin",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "mfaBackupCodes" DROP DEFAULT;

-- DropTable
DROP TABLE "audit_logs";

-- CreateTable
CREATE TABLE "interview_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "mode" TEXT NOT NULL DEFAULT 'TEXT',
    "status" "InterviewSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "score" DOUBLE PRECISION,
    "durationMin" INTEGER,
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audioPath" TEXT,
    "fillerWords" INTEGER NOT NULL DEFAULT 0,
    "starMethod" BOOLEAN NOT NULL DEFAULT false,
    "sentiment" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_contracts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL DEFAULT 'EMPLOYMENT',
    "analysisStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "riskLevel" TEXT,
    "riskCount" INTEGER NOT NULL DEFAULT 0,
    "clauseCount" INTEGER NOT NULL DEFAULT 0,
    "findings" JSONB,
    "documentId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analyzedAt" TIMESTAMP(3),

    CONSTRAINT "legal_contracts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_messages" ADD CONSTRAINT "interview_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_contracts" ADD CONSTRAINT "legal_contracts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
