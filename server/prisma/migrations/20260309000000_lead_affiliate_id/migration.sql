-- Add affiliateId to Lead if missing (required for affiliate summary/list)
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "affiliateId" TEXT;

-- Add FK to Affiliate if constraint does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'Lead' AND c.conname = 'Lead_affiliateId_fkey'
  ) THEN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_affiliateId_fkey"
      FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Lead_affiliateId_idx" ON "Lead"("affiliateId");
