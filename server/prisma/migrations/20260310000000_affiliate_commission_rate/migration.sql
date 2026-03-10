-- Add missing Affiliate columns: commissionRate and payoutRate (schema expects them)
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "commissionRate" DECIMAL(10,4);
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "payoutRate" DECIMAL(10,4);
