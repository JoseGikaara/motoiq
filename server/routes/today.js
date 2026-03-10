import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

export const todayRouter = Router();

todayRouter.use(requireAuth);

todayRouter.get("/", async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const now = new Date();

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [overdueTasks, hotLeads, upcomingTestDrives, dealer, monthAgg, weekAgg, dueEnrollments] = await Promise.all([
      prisma.task.findMany({
        where: {
          dealerId,
          done: false,
          createdAt: { lte: oneDayAgo },
        },
        include: {
          lead: {
            include: { car: true },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      }),
      prisma.lead.findMany({
        where: {
          dealerId,
          status: { in: ["NEW", "CONTACTED", "TEST_DRIVE", "NEGOTIATION"] },
          OR: [
            { score: "hot" },
            { urgency: { gte: 7 } },
          ],
          updatedAt: { lte: twoDaysAgo },
        },
        include: {
          car: true,
        },
        orderBy: {
          updatedAt: "asc",
        },
        take: 20,
      }),
      prisma.testDrive.findMany({
        where: {
          dealerId,
          date: {
            gte: now,
            lte: in48h,
          },
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
        include: {
          car: true,
          lead: true,
        },
        orderBy: { date: "asc" },
        take: 20,
      }),
      prisma.dealer.findUnique({
        where: { id: dealerId },
        select: {
          monthlyTargetDeals: true,
          commissionRate: true,
          currency: true,
        },
      }),
      prisma.lead.aggregate({
        where: {
          dealerId,
          status: "CLOSED",
          updatedAt: { gte: startOfMonth },
        },
        _count: { _all: true },
        _sum: { dealValue: true },
      }),
      prisma.lead.aggregate({
        where: {
          dealerId,
          status: "CLOSED",
          updatedAt: { gte: sevenDaysAgo },
        },
        _count: { _all: true },
        _sum: { dealValue: true },
      }),
      prisma.leadDripEnrollment.findMany({
        where: {
          status: "ACTIVE",
          lead: { dealerId },
        },
        include: {
          lead: {
            include: { car: true },
          },
          sequence: {
            include: {
              steps: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      }),
    ]);

    const dueDrips = [];
    const dayMs = 24 * 60 * 60 * 1000;

    for (const enrollment of dueEnrollments) {
      const { lead, sequence } = enrollment;
      if (!lead || !sequence) continue;
      if (lead.status === "CLOSED" || lead.status === "LOST") continue;
      const steps = sequence.steps || [];
      const stepIndex = enrollment.currentStep - 1;
      const step = steps[stepIndex];
      if (!step) continue;

      const referenceDate = enrollment.lastSentAt || enrollment.startedAt;
      const daysSince = (now.getTime() - referenceDate.getTime()) / dayMs;
      if (daysSince < step.triggerAfterDays) continue;

      const dueAt = new Date(referenceDate.getTime() + step.triggerAfterDays * dayMs);

      dueDrips.push({
        enrollmentId: enrollment.id,
        leadId: lead.id,
        leadName: lead.name,
        car: lead.car
          ? `${lead.car.make || ""} ${lead.car.model || ""} ${lead.car.year || ""}`.trim()
          : null,
        sequenceId: sequence.id,
        sequenceName: sequence.name,
        stepOrder: step.order,
        channel: step.channel,
        dueAt,
      });
    }

    const closedThisMonth = monthAgg._count._all || 0;
    const totalValueThisMonth = Number(monthAgg._sum.dealValue ?? 0);
    const closedThisWeek = weekAgg._count._all || 0;
    const totalValueThisWeek = Number(weekAgg._sum.dealValue ?? 0);

    const monthlyTargetDeals = dealer?.monthlyTargetDeals ?? null;
    const commissionRate = dealer?.commissionRate != null ? Number(dealer.commissionRate) : null;
    const currency = dealer?.currency ?? "KES";

    const progressToTarget =
      monthlyTargetDeals && monthlyTargetDeals > 0
        ? Math.min(100, Math.round((100 * closedThisMonth) / monthlyTargetDeals))
        : null;

    const estimatedCommissionMonth =
      commissionRate != null ? Math.round(totalValueThisMonth * commissionRate) : null;

    res.json({
      overdueTasks,
      hotLeads,
      upcomingTestDrives,
      dueDrips: dueDrips.slice(0, 20),
      stats: {
        closedThisWeek,
        totalValueThisWeek,
        closedThisMonth,
        totalValueThisMonth,
        monthlyTargetDeals,
        commissionRate,
        currency,
        progressToTarget,
        estimatedCommissionMonth,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load today agenda" });
  }
});

