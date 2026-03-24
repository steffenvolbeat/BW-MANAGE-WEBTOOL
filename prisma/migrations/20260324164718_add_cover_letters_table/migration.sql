-- CreateTable: cover_letters for multiple cover letters per application
CREATE TABLE IF NOT EXISTS "cover_letters" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Anschreiben',
    "itBereich" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "cover_letters_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
