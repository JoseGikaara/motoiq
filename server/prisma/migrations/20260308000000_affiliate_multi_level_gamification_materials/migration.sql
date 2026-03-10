-- AlterTable Dealer: multi-level affiliate settings
ALTER TABLE "Dealer" ADD COLUMN IF NOT EXISTS "affiliateMultiLevelDepth" INTEGER;
ALTER TABLE "Dealer" ADD COLUMN IF NOT EXISTS "affiliateLevel2Rate" DECIMAL(5,4);
ALTER TABLE "Dealer" ADD COLUMN IF NOT EXISTS "affiliateLevel3Rate" DECIMAL(5,4);

-- CreateEnum
CREATE TYPE "AffiliateChallengeTarget" AS ENUM ('LEADS', 'TEST_DRIVES', 'CLOSED_DEALS', 'REVENUE');

-- CreateTable DealerAffiliateMaterial
CREATE TABLE "DealerAffiliateMaterial" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DealerAffiliateMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable AffiliateChallenge
CREATE TABLE "AffiliateChallenge" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetType" "AffiliateChallengeTarget" NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "rewardDescription" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AffiliateChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable AffiliateChallengeProgress
CREATE TABLE "AffiliateChallengeProgress" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AffiliateChallengeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealerAffiliateMaterial_dealerId_idx" ON "DealerAffiliateMaterial"("dealerId");
CREATE INDEX "AffiliateChallenge_dealerId_isActive_idx" ON "AffiliateChallenge"("dealerId", "isActive");
CREATE UNIQUE INDEX "AffiliateChallengeProgress_affiliateId_challengeId_key" ON "AffiliateChallengeProgress"("affiliateId", "challengeId");
CREATE INDEX "AffiliateChallengeProgress_affiliateId_idx" ON "AffiliateChallengeProgress"("affiliateId");
CREATE INDEX "AffiliateChallengeProgress_challengeId_idx" ON "AffiliateChallengeProgress"("challengeId");

-- AddForeignKey
ALTER TABLE "DealerAffiliateMaterial" ADD CONSTRAINT "DealerAffiliateMaterial_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateChallenge" ADD CONSTRAINT "AffiliateChallenge_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateChallengeProgress" ADD CONSTRAINT "AffiliateChallengeProgress_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateChallengeProgress" ADD CONSTRAINT "AffiliateChallengeProgress_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "AffiliateChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
