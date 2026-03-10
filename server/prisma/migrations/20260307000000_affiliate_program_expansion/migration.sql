-- CreateEnum
CREATE TYPE "AffiliateStatus" AS ENUM ('ACTIVE', 'PAUSED', 'SUSPENDED');
CREATE TYPE "AffiliateTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE "AffiliateCommissionType" AS ENUM ('PERCENTAGE', 'FIXED', 'HYBRID');
CREATE TYPE "AffiliatePayoutMethod" AS ENUM ('MPESA', 'BANK_TRANSFER', 'PAYPAL', 'CASH');
CREATE TYPE "AffiliatePayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "AffiliateLevel" AS ENUM ('INDIVIDUAL', 'AGENCY', 'PARTNER');

-- AlterTable Affiliate: add new columns and migrate status to enum
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "statusNew" "AffiliateStatus" DEFAULT 'ACTIVE';
UPDATE "Affiliate" SET "statusNew" = CASE WHEN "status" = 'paused' THEN 'PAUSED'::"AffiliateStatus" ELSE 'ACTIVE'::"AffiliateStatus" END WHERE "statusNew" IS NULL;
ALTER TABLE "Affiliate" DROP COLUMN IF EXISTS "status";
ALTER TABLE "Affiliate" RENAME COLUMN "statusNew" TO "status";
ALTER TABLE "Affiliate" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
ALTER TABLE "Affiliate" ALTER COLUMN "status" SET NOT NULL;

ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "level" "AffiliateLevel" NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "tier" "AffiliateTier" NOT NULL DEFAULT 'BRONZE';
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "commissionType" "AffiliateCommissionType" NOT NULL DEFAULT 'PERCENTAGE';
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "fixedLeadAmount" DECIMAL(10,2);
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "fixedTestDriveAmount" DECIMAL(10,2);
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "fixedCloseAmount" DECIMAL(10,2);
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "hybridBaseRate" DECIMAL(10,4);
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "hybridFixedAmount" DECIMAL(10,2);
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "tierMultiplier" DECIMAL(5,2) DEFAULT 1;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "priorityLeads" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "featuredPartner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "totalPaid" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "lifetimeLeads" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "lifetimeTestDrives" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "lifetimeClosedDeals" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "conversionRate" DECIMAL(5,2);
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "payoutMethod" "AffiliatePayoutMethod";
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "payoutDetails" JSONB;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "minimumPayout" DECIMAL(10,2) NOT NULL DEFAULT 1000;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "autoPayoutThreshold" DECIMAL(10,2);
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "uniqueQrCode" TEXT;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "promoVideo" TEXT;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "promoImages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP(3);
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "invitedBy" TEXT;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "welcomeEmailSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "welcomeSmsSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "allowedCarIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "excludedCarIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "maxCars" INTEGER;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "customFields" JSONB;
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: existing totalEarned was used as "amount paid" -> store in totalPaid
UPDATE "Affiliate" SET "totalPaid" = "totalEarned" WHERE "totalPaid" = 0 AND "totalEarned" > 0;
-- Backfill totalEarned from sum of ReferralEvent values (commission earned)
UPDATE "Affiliate" a SET "totalEarned" = COALESCE((
  SELECT SUM(r.value) FROM "ReferralEvent" r WHERE r."affiliateId" = a.id
), 0);

-- CreateTable AffiliatePayout
CREATE TABLE "AffiliatePayout" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "AffiliatePayoutMethod" NOT NULL,
    "status" "AffiliatePayoutStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AffiliatePayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable AffiliateLink
CREATE TABLE "AffiliateLink" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "carId" TEXT,
    "customSlug" TEXT,
    "url" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "leadsGenerated" INTEGER NOT NULL DEFAULT 0,
    "testDrivesBooked" INTEGER NOT NULL DEFAULT 0,
    "dealsClosed" INTEGER NOT NULL DEFAULT 0,
    "lastClickedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "utmParams" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable AffiliateCommissionRule
CREATE TABLE "AffiliateCommissionRule" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "appliesToAllCars" BOOLEAN NOT NULL DEFAULT true,
    "carIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "carConditions" JSONB,
    "commissionType" "AffiliateCommissionType" NOT NULL,
    "rate" DECIMAL(10,4),
    "fixedAmount" DECIMAL(10,2),
    "hybridRate" DECIMAL(10,4),
    "hybridFixed" DECIMAL(10,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "minAffiliateTier" "AffiliateTier",
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AffiliateCommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable AffiliatePerformance
CREATE TABLE "AffiliatePerformance" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "performanceDate" DATE NOT NULL,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "testDrives" INTEGER NOT NULL DEFAULT 0,
    "closedDeals" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "linkClicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "avgTimeOnSite" INTEGER,
    "bounceRate" DECIMAL(5,2),

    CONSTRAINT "AffiliatePerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_shortCode_key" ON "AffiliateLink"("shortCode");
CREATE UNIQUE INDEX "AffiliateLink_dealerId_shortCode_key" ON "AffiliateLink"("dealerId", "shortCode");
CREATE UNIQUE INDEX "AffiliatePerformance_affiliateId_performanceDate_key" ON "AffiliatePerformance"("affiliateId", "performanceDate");

CREATE INDEX "AffiliatePayout_affiliateId_status_idx" ON "AffiliatePayout"("affiliateId", "status");
CREATE INDEX "AffiliatePayout_status_paidAt_idx" ON "AffiliatePayout"("status", "paidAt");
CREATE INDEX "AffiliateLink_affiliateId_isActive_idx" ON "AffiliateLink"("affiliateId", "isActive");
CREATE INDEX "AffiliateCommissionRule_dealerId_isActive_idx" ON "AffiliateCommissionRule"("dealerId", "isActive");
CREATE INDEX "AffiliatePerformance_affiliateId_performanceDate_idx" ON "AffiliatePerformance"("affiliateId", "performanceDate");
CREATE INDEX "Affiliate_invitedBy_idx" ON "Affiliate"("invitedBy");
CREATE INDEX "Affiliate_dealerId_status_idx" ON "Affiliate"("dealerId", "status");

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AffiliatePayout" ADD CONSTRAINT "AffiliatePayout_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AffiliateCommissionRule" ADD CONSTRAINT "AffiliateCommissionRule_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliatePerformance" ADD CONSTRAINT "AffiliatePerformance_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
