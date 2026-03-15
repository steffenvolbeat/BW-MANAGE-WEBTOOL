-- CreateTable
CREATE TABLE "file_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b7280',
    "icon" TEXT NOT NULL DEFAULT 'folder',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "file_folders_pkey" PRIMARY KEY ("id")
);

-- Clear stale in-memory folder IDs that don't exist in file_folders
UPDATE "documents" SET "fileBrowserFolderId" = NULL
WHERE "fileBrowserFolderId" IS NOT NULL
  AND "fileBrowserFolderId" NOT IN (SELECT "id" FROM "file_folders");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_fileBrowserFolderId_fkey" FOREIGN KEY ("fileBrowserFolderId") REFERENCES "file_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_folders" ADD CONSTRAINT "file_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "file_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_folders" ADD CONSTRAINT "file_folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
