-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "alg" TEXT,
ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "ciphertext" TEXT,
ADD COLUMN     "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "iv" TEXT,
ADD COLUMN     "keyHint" TEXT,
ADD COLUMN     "wrappedKey" TEXT,
ALTER COLUMN "filePath" DROP NOT NULL;

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "alg" TEXT,
ADD COLUMN     "ciphertext" TEXT,
ADD COLUMN     "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "iv" TEXT,
ADD COLUMN     "keyHint" TEXT,
ADD COLUMN     "wrappedKey" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mfaBackupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfaSecret" TEXT;
