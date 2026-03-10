-- Affiliate table has updatedAt but was missing createdAt (Prisma schema expects both)
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
