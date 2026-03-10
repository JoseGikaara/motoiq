-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('ROTATING', 'FLASH_SALE', 'HEADLINE');

-- CreateEnum
CREATE TYPE "BannerTarget" AS ENUM ('NONE', 'INVENTORY', 'FINANCING', 'CONTACT', 'CUSTOM_URL');

-- CreateTable
CREATE TABLE "DealerBanner" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "type" "BannerType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "ctaText" TEXT,
    "ctaTarget" "BannerTarget" NOT NULL,
    "ctaUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "backgroundColor" TEXT,
    "textColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerBanner_pkey" PRIMARY KEY ("id")
);

-- Add hero fields to Car
ALTER TABLE "Car" ADD COLUMN "heroDisplayOrder" INTEGER;
ALTER TABLE "Car" ADD COLUMN "heroOverlayText" TEXT;

-- CreateIndex
CREATE INDEX "DealerBanner_dealerId_idx" ON "DealerBanner"("dealerId");

-- AddForeignKey
ALTER TABLE "DealerBanner" ADD CONSTRAINT "DealerBanner_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
