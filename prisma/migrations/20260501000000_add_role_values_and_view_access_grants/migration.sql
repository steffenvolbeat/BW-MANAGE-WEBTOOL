-- AlterEnum: MANAGER und VERMITTLER zum Role-Enum hinzufügen
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MANAGER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VERMITTLER';

-- CreateTable: view_access_grants
CREATE TABLE IF NOT EXISTS view_access_grants (
    "id" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "view_access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "view_access_grants_granteeId_idx" ON view_access_grants("granteeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "view_access_grants_targetId_idx" ON view_access_grants("targetId");

-- CreateUniqueIndex
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'view_access_grants_granteeId_targetId_key'
  ) THEN
    ALTER TABLE view_access_grants ADD CONSTRAINT "view_access_grants_granteeId_targetId_key" UNIQUE ("granteeId", "targetId");
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'view_access_grants_granteeId_fkey'
  ) THEN
    ALTER TABLE view_access_grants ADD CONSTRAINT "view_access_grants_granteeId_fkey" FOREIGN KEY ("granteeId") REFERENCES users("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'view_access_grants_targetId_fkey'
  ) THEN
    ALTER TABLE view_access_grants ADD CONSTRAINT "view_access_grants_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES users("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
