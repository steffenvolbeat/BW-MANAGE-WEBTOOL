-- Add sender and recipient address fields to cover_letters table
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "senderAddress" TEXT;
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "recipientAddress" TEXT;
