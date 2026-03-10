-- Add hero columns to Car if missing (run with: psql $DATABASE_URL -f prisma/add_car_hero_columns.sql)
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "heroDisplayOrder" INTEGER;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "heroOverlayText" TEXT;
