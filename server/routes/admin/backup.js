import { Router } from "express";
import prisma from "../../lib/prisma.js";

export const adminBackupRouter = Router();

// Simple admin guard based on x-admin-secret header to keep implementation focused.
adminBackupRouter.use((req, res, next) => {
  const secret = process.env.ADMIN_BACKUP_SECRET;
  if (!secret) return res.status(500).json({ error: "Backup not configured" });
  if (req.headers["x-admin-backup-secret"] !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// GET /api/admin/backup — export dealers + cars + leads + test drives as JSON
adminBackupRouter.get("/backup", async (req, res) => {
  try {
    const dealers = await prisma.dealer.findMany({
      include: {
        cars: true,
        leads: true,
        testDrives: true,
        subscription: true,
      },
    });
    const payload = {
      generatedAt: new Date().toISOString(),
      dealers,
    };
    res.json(payload);
  } catch (e) {
    console.error("Backup export failed:", e);
    res.status(500).json({ error: "Failed to export backup" });
  }
});

// POST /api/admin/restore — restore basic dealer data (emergency only)
adminBackupRouter.post("/restore", async (req, res) => {
  try {
    const { dealers } = req.body || {};
    if (!Array.isArray(dealers)) {
      return res.status(400).json({ error: "Invalid payload: dealers array required" });
    }

    for (const dealer of dealers) {
      // Upsert dealer core fields only; associated records can be re-imported manually if needed.
      const { id, email, name, dealershipName, phone, city, websiteSlug, websiteActive, websiteExpiresAt } = dealer;
      await prisma.dealer.upsert({
        where: { id },
        update: {
          email,
          name,
          dealershipName,
          phone,
          city,
          websiteSlug,
          websiteActive,
          websiteExpiresAt: websiteExpiresAt ? new Date(websiteExpiresAt) : null,
        },
        create: {
          id,
          email,
          name,
          dealershipName,
          phone,
          city,
          websiteSlug,
          websiteActive: Boolean(websiteActive),
          websiteExpiresAt: websiteExpiresAt ? new Date(websiteExpiresAt) : null,
          password: dealer.password || "",
        },
      });
    }

    res.json({ ok: true, restoredDealers: dealers.length });
  } catch (e) {
    console.error("Backup restore failed:", e);
    res.status(500).json({ error: "Failed to restore backup" });
  }
});

