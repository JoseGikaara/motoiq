# MotorIQ database setup (SQL)

You can set up the database in two ways: **recommended** (Prisma) or **manual** (run SQL yourself).

---

## Option 1: Recommended — use Prisma (no raw SQL)

From the `server` directory with `DATABASE_URL` and `DIRECT_URL` in `.env`:

```bash
cd server
npx prisma migrate deploy
```

This runs all migration SQL files in order and creates the `_prisma_migrations` table. No need to run any SQL by hand.

Then ensure the **SystemSettings** row exists (app expects one row with `id = 'singleton'`):

```bash
npm run seed:admin
```

That script also creates an optional admin user; it will upsert the SystemSettings row.

---

## Option 2: Manual SQL (e.g. in Supabase SQL Editor)

If you prefer to run SQL yourself (e.g. in Supabase):

### Step 1: Run migration SQL in order

Run the contents of each file below **in this order** (oldest first):

1. `migrations/0_init/migration.sql`
2. `migrations/20250301000000_system_settings_credits/migration.sql`
3. `migrations/2026030100010_communication_log/migration.sql`
4. `migrations/20260302000000_phase3_drip_incentive/migration.sql`
5. `migrations/20260303000000_add_dealer_website_fields/migration.sql`
6. `migrations/20260304000000_banners_hero_fields/migration.sql`
7. `migrations/20260305000000_car_photos/migration.sql`
8. `migrations/20260306000000_car_hero_columns/migration.sql`
9. `migrations/20260307000000_affiliate_program_expansion/migration.sql`
10. `migrations/20260308000000_affiliate_multi_level_gamification_materials/migration.sql`
11. `migrations/20260309000000_lead_affiliate_id/migration.sql`
12. `migrations/20260310000000_affiliate_commission_rate/migration.sql`
13. `migrations/20260311000000_affiliate_created_at/migration.sql`
14. `migrations/20260312000000_affiliate_sync_all_columns/migration.sql`
15. `migrations/20260313000000_affiliate_tracking_url/migration.sql`

**Note:** If your schema has more columns (e.g. after `prisma db push`), Prisma may have applied extra changes that are not in these migrations. In that case Option 1 is safer.

### Step 2: Insert required data

Run the SQL in **`seed_system_settings.sql`** (in this folder) once. It inserts the single **SystemSettings** row the app expects (`id = 'singleton'`).

---

## Summary

| What            | How |
|-----------------|-----|
| Create schema   | Option 1: `npx prisma migrate deploy` — or Option 2: run each `migrations/.../migration.sql` in order. |
| SystemSettings  | Option 1: `npm run seed:admin` — or Option 2: run `seed_system_settings.sql`. |
| Admin user      | Optional: `npm run seed:admin` (creates admin@motoriq.co.ke). |
