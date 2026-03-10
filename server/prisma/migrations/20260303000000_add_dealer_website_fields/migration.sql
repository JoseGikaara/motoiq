-- AlterTable
ALTER TABLE "Dealer" ADD COLUMN IF NOT EXISTS "websiteSlug" TEXT,
ADD COLUMN IF NOT EXISTS "websiteActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "websiteExpiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "customDomain" TEXT,
ADD COLUMN IF NOT EXISTS "heroImage" TEXT,
ADD COLUMN IF NOT EXISTS "aboutText" TEXT;

-- CreateIndex (only if not exists - run manually if needed)
-- CREATE UNIQUE INDEX "Dealer_websiteSlug_key" ON "Dealer"("websiteSlug");
-- CREATE UNIQUE INDEX "Dealer_customDomain_key" ON "Dealer"("customDomain");
