import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();

router.get("/", adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const totalDealers = await prisma.dealer.count({ where: { isActive: true } });
    const totalLeads = await prisma.lead.count();
    const totalCars = await prisma.car.count();
    const totalTestDrives = await prisma.testDrive.count();
    const newDealersThisMonth = await prisma.dealer.count({ where: { createdAt: { gte: startOfMonth } } });
    const newLeadsThisWeek = await prisma.lead.count({ where: { createdAt: { gte: startOfWeek } } });
    const trialSubs = await prisma.subscription.count({ where: { plan: "TRIAL", status: "ACTIVE" } });
    const activeSubs = await prisma.subscription.findMany({
      where: { status: "ACTIVE", plan: { not: "TRIAL" } },
      select: { amount: true },
    });
    const totalRevenue = activeSubs.reduce((acc, x) => acc + (x.amount || 0), 0);

    const leadCounts = await prisma.lead.groupBy({ by: ["dealerId"], _count: { id: true } });
    const sorted = leadCounts.sort((a, b) => b._count.id - a._count.id);
    let topDealer = { name: "None", count: 0 };
    if (sorted[0]) {
      const d = await prisma.dealer.findUnique({
        where: { id: sorted[0].dealerId },
        select: { dealershipName: true, name: true },
      });
      if (d) topDealer = { name: d.dealershipName || d.name, count: sorted[0]._count.id };
    }
    const avgLeadsPerDealer = totalDealers ? Math.round(totalLeads / totalDealers) : 0;

    res.json({
      totalDealers,
      activeDealers: totalDealers,
      trialDealers: trialSubs,
      totalLeads,
      totalCars,
      totalTestDrives,
      totalRevenue,
      newDealersThisMonth,
      newLeadsThisWeek,
      avgLeadsPerDealer,
      topDealerByLeads: topDealer,
    });
  } catch (e) {
    console.error("Admin stats error:", e);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

export default router;
