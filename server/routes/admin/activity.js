import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();

router.get("/", adminAuth, async (req, res) => {
  try {
    const { dealerId, limit = "50" } = req.query;
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const where = dealerId ? { dealerId } : {};
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      include: { dealer: { select: { id: true, name: true, dealershipName: true } } },
    });
    res.json(logs);
  } catch (e) {
    console.error("Admin activity error:", e);
    res.status(500).json({ error: "Failed to load activity" });
  }
});

export default router;
