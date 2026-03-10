-- Affiliate.trackingUrl may be missing if table was created without it
ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "trackingUrl" TEXT;
