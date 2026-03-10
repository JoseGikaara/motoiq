import { Router } from "express";
import rateLimit from "express-rate-limit";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { generateReferralCode } from "../utils/referral.js";
import { getQrCodeUrl, buildReferralUrl, sendInviteEmail, sendInviteSms } from "../services/affiliateInvitation.js";

export const affiliatesRouter = Router();

affiliatesRouter.use(requireAuth);

const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/affiliates/summary — high-level stats and top performers
affiliatesRouter.get("/summary", async (req, res) => {
  const dealerId = req.dealer.id;
  const emptySummary = {
    totalAffiliates: 0,
    referredLeads: 0,
    referredClosed: 0,
    totalEstimatedCommission: 0,
    topPerformers: [],
  };
  try {
    const [affiliates, referredLeads, referredClosed] = await Promise.all([
      prisma.affiliate.findMany({
        where: { dealerId },
        include: { _count: { select: { leads: true, events: true } } },
      }),
      prisma.lead.count({
        where: { dealerId, affiliateId: { not: null } },
      }),
      prisma.lead.count({
        where: { dealerId, affiliateId: { not: null }, status: "CLOSED" },
      }),
    ]);

    const events = await prisma.referralEvent.groupBy({
      by: ["affiliateId"],
      where: { affiliate: { dealerId } },
      _sum: { value: true },
    });
    const earnedByAffiliate = Object.fromEntries(
      events.map((e) => [e.affiliateId, Number(e._sum.value ?? 0)])
    );

    const totalAffiliates = affiliates.length;
    const totalEarned = Object.values(earnedByAffiliate).reduce((s, v) => s + v, 0);

    const topPerformers = affiliates
      .map((a) => {
        const leadsCount = a._count.leads;
        const closedCount = 0;
        const earned = earnedByAffiliate[a.id] ?? 0;
        return {
          id: a.id,
          name: a.name,
          email: a.email,
          phone: a.phone,
          referralCode: a.referralCode,
          leads: leadsCount,
          closed: closedCount,
          earned,
        };
      })
      .sort((a, b) => b.earned - a.earned || b.leads - a.leads)
      .slice(0, 5);

    return res.json({
      totalAffiliates,
      referredLeads,
      referredClosed,
      totalEstimatedCommission: totalEarned,
      topPerformers,
    });
  } catch (e) {
    console.error("Affiliates summary error:", e?.message || e);
    return res.status(200).json(emptySummary);
  }
});

// GET /api/affiliates — list affiliates + stats
affiliatesRouter.get("/", async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const affiliates = await prisma.affiliate.findMany({
      where: { dealerId },
      orderBy: { id: "desc" },
      include: {
        _count: { select: { leads: true, events: true } },
      },
    });

    const events = await prisma.referralEvent.groupBy({
      by: ["affiliateId"],
      where: { affiliate: { dealerId } },
      _sum: { value: true },
    });
    const earnedByAffiliate = Object.fromEntries(
      events.map((e) => [e.affiliateId, Number(e._sum.value ?? 0)])
    );

    const list = affiliates.map((a) => {
      const earned = earnedByAffiliate[a.id] ?? 0;
      const totalPaid = a.totalPaid != null ? Number(a.totalPaid) : 0;
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        referralCode: a.referralCode,
        trackingUrl: a.trackingUrl,
        status: a.status,
        tier: a.tier,
        payoutRate: a.payoutRate != null ? Number(a.payoutRate) : null,
        commissionRate: a.commissionRate != null ? Number(a.commissionRate) : null,
        joinedAt: a.joinedAt,
        leads: a._count.leads,
        totalEarned: a.totalEarned != null ? Number(a.totalEarned) : 0,
        totalPaid,
        estimatedCommission: earned,
        balance: Math.max(0, earned - totalPaid),
      };
    });

    return res.json({ affiliates: list });
  } catch (e) {
    console.error("Affiliates list error:", e?.message || e);
    return res.status(200).json({ affiliates: [] });
  }
});

// POST /api/affiliates — create affiliate & generate code
affiliatesRouter.post("/", inviteLimiter, async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const { name, email, phone, payoutRate } = req.body || {};
    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    let code;
    for (let i = 0; i < 5; i++) {
      const candidate = generateReferralCode(6);
      const existing = await prisma.affiliate.findUnique({ where: { referralCode: candidate } });
      if (!existing) {
        code = candidate;
        break;
      }
    }
    if (!code) code = generateReferralCode(8);

    const baseUrl = process.env.BASE_URL || req.protocol + "://" + req.get("host") || "";
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
      select: { websiteSlug: true, dealershipName: true },
    });
    const referralUrl = buildReferralUrl(baseUrl, code, dealer?.websiteSlug);
    const uniqueQrCode = getQrCodeUrl(referralUrl);

    const affiliate = await prisma.affiliate.create({
      data: {
        dealerId,
        name,
        email: email || null,
        phone,
        referralCode: code,
        trackingUrl: "",
        status: "ACTIVE",
        commissionRate: payoutRate != null ? Number(payoutRate) : null,
        payoutRate: payoutRate != null ? Number(payoutRate) : null,
        invitedAt: new Date(),
        uniqueQrCode,
      },
    });

    // Optional: send invite email/SMS (stubs until configured)
    if (affiliate.email) sendInviteEmail(affiliate, dealer || {}, referralUrl).catch(() => {});
    if (affiliate.phone) sendInviteSms(affiliate, dealer || {}, referralUrl).catch(() => {});

    res.status(201).json(affiliate);
  } catch (e) {
    console.error("Create affiliate error:", e);
    res.status(500).json({ error: "Failed to create affiliate" });
  }
});

// PATCH /api/affiliates/:id — update basic settings (status, payoutRate)
affiliatesRouter.patch("/:id", async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const { status, payoutRate } = req.body || {};
    const data = {};
    const statusNorm = status && (status === "active" || status === "ACTIVE") ? "ACTIVE" : status === "paused" || status === "PAUSED" ? "PAUSED" : null;
    if (statusNorm) data.status = statusNorm;
    if (payoutRate !== undefined) {
      data.payoutRate = payoutRate == null ? null : Number(payoutRate);
      data.commissionRate = payoutRate == null ? null : Number(payoutRate);
    }

    const updated = await prisma.affiliate.updateMany({
      where: { id: req.params.id, dealerId },
      data,
    });
    if (!updated.count) {
      return res.status(404).json({ error: "Affiliate not found" });
    }
    const affiliate = await prisma.affiliate.findUnique({ where: { id: req.params.id } });
    res.json(affiliate);
  } catch (e) {
    console.error("Update affiliate error:", e);
    res.status(500).json({ error: "Failed to update affiliate" });
  }
});

// GET /api/affiliates/leaderboard — top performers (query: period=week|month|all)
affiliatesRouter.get("/leaderboard", async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const period = req.query.period || "month";
    const events = await prisma.referralEvent.groupBy({
      by: ["affiliateId"],
      where: {
        affiliate: { dealerId },
        ...(period === "week"
          ? { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
          : period === "month"
            ? { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
            : {}),
      },
      _sum: { value: true },
      _count: { id: true },
    });
    const affiliateIds = [...new Set(events.map((e) => e.affiliateId))];
    const affiliates = await prisma.affiliate.findMany({
      where: { id: { in: affiliateIds } },
      select: { id: true, name: true, referralCode: true, tier: true },
    });
    const byId = Object.fromEntries(affiliates.map((a) => [a.id, a]));
    const leaderboard = events
      .map((e) => ({
        ...byId[e.affiliateId],
        earned: Number(e._sum.value ?? 0),
        eventsCount: e._count.id,
      }))
      .sort((a, b) => b.earned - a.earned)
      .slice(0, 10);
    res.json({ period, leaderboard });
  } catch (e) {
    console.error("Leaderboard error (run migrations if needed):", e.message);
    res.json({ period: "month", leaderboard: [] });
  }
});

// GET /api/affiliates/commission-rules
affiliatesRouter.get("/commission-rules", async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const rules = await prisma.affiliateCommissionRule.findMany({
      where: { dealerId },
      orderBy: [{ priority: "desc" }, { id: "desc" }],
    });
    res.json({ rules });
  } catch (e) {
    console.error("Commission rules error (run migrations if needed):", e.message);
    res.json({ rules: [] });
  }
});

// POST /api/affiliates/commission-rules
affiliatesRouter.post("/commission-rules", async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const { name, description, appliesToAllCars, carIds, commissionType, rate, fixedAmount, startDate, endDate, minAffiliateTier, priority } = req.body || {};
    if (!name || !commissionType) {
      return res.status(400).json({ error: "Name and commissionType required" });
    }
    const rule = await prisma.affiliateCommissionRule.create({
      data: {
        dealerId,
        name,
        description: description || null,
        appliesToAllCars: appliesToAllCars !== false,
        carIds: Array.isArray(carIds) ? carIds : [],
        commissionType,
        rate: rate != null ? Number(rate) : null,
        fixedAmount: fixedAmount != null ? Number(fixedAmount) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        minAffiliateTier: minAffiliateTier || null,
        priority: priority != null ? Number(priority) : 0,
      },
    });
    res.status(201).json(rule);
  } catch (e) {
    console.error("Create commission rule error:", e);
    res.status(500).json({ error: "Failed to create rule" });
  }
});

// GET /api/affiliates/payouts — pending/completed payouts for dealer's affiliates
affiliatesRouter.get("/payouts", async (req, res) => {
  try {
    const dealerId = req.dealer?.id;
    if (!dealerId) {
      return res.status(401).json({ error: "Unauthorized", payouts: [] });
    }
    const status = req.query.status; // PENDING, PROCESSING, COMPLETED, FAILED
    const payouts = await prisma.affiliatePayout.findMany({
      where: { affiliate: { dealerId }, ...(status ? { status } : {}) },
      include: { affiliate: { select: { id: true, name: true, referralCode: true } } },
      orderBy: { periodStart: "desc" },
      take: 100,
    });
    return res.json({ payouts });
  } catch (e) {
    console.error("[GET /api/affiliates/payouts] error:", e?.message ?? e);
    if (e?.stack) console.error(e.stack);
    return res.status(200).json({ payouts: [] });
  }
});

// GET /api/affiliates/challenges
affiliatesRouter.get("/challenges", async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const challenges = await prisma.affiliateChallenge.findMany({
      where: { dealerId },
      orderBy: { endDate: "desc" },
      include: { _count: { select: { progress: true } } },
    });
    res.json({ challenges });
  } catch (e) {
    console.error("Challenges error (run migrations if needed):", e.message);
    res.json({ challenges: [] });
  }
});

// POST /api/affiliates/challenges
affiliatesRouter.post("/challenges", async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const { name, description, targetType, targetValue, rewardDescription, startDate, endDate } = req.body || {};
    if (!name || !targetType || targetValue == null) {
      return res.status(400).json({ error: "name, targetType and targetValue required" });
    }
    const challenge = await prisma.affiliateChallenge.create({
      data: {
        dealerId,
        name,
        description: description || null,
        targetType,
        targetValue: Math.max(0, Number(targetValue)),
        rewardDescription: rewardDescription || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    res.status(201).json(challenge);
  } catch (e) {
    console.error("Create challenge error:", e);
    res.status(500).json({ error: "Failed to create challenge" });
  }
});

// GET /api/affiliates/materials
affiliatesRouter.get("/materials", async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const materials = await prisma.dealerAffiliateMaterial.findMany({
      where: { dealerId },
      orderBy: { displayOrder: "asc" },
    });
    res.json({ materials });
  } catch (e) {
    console.error("Materials error (run migrations if needed):", e.message);
    res.json({ materials: [] });
  }
});

// POST /api/affiliates/materials
affiliatesRouter.post("/materials", async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const { name, type, url, displayOrder } = req.body || {};
    if (!name || !type || !url) {
      return res.status(400).json({ error: "name, type and url required" });
    }
    const material = await prisma.dealerAffiliateMaterial.create({
      data: {
        dealerId,
        name,
        type: type || "other",
        url,
        displayOrder: displayOrder != null ? Number(displayOrder) : 0,
      },
    });
    res.status(201).json(material);
  } catch (e) {
    console.error("Create material error:", e);
    res.status(500).json({ error: "Failed to create material" });
  }
});

// DELETE /api/affiliates/materials/:id
affiliatesRouter.delete("/materials/:id", async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const deleted = await prisma.dealerAffiliateMaterial.deleteMany({
      where: { id: req.params.id, dealerId },
    });
    if (!deleted.count) return res.status(404).json({ error: "Material not found" });
    res.status(204).send();
  } catch (e) {
    console.error("Delete material error:", e);
    res.status(500).json({ error: "Failed to delete material" });
  }
});

// POST /api/affiliates/bulk-invite — create multiple affiliates and send invites
affiliatesRouter.post("/bulk-invite", inviteLimiter, async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const list = Array.isArray(req.body) ? req.body : Array.isArray(req.body?.affiliates) ? req.body.affiliates : [];
    if (list.length === 0 || list.length > 50) {
      return res.status(400).json({ error: "Send an array of 1–50 affiliates: { name, phone, email?, payoutRate? }" });
    }
    const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || "";
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
      select: { dealershipName: true, websiteSlug: true },
    });
    const created = [];
    const errors = [];
    for (let i = 0; i < list.length; i++) {
      const row = list[i];
      const name = row.name?.trim();
      const phone = row.phone?.trim();
      if (!name || !phone) {
        errors.push({ index: i, error: "Name and phone required" });
        continue;
      }
      let code = generateReferralCode(6);
      for (let k = 0; k < 5; k++) {
        const ex = await prisma.affiliate.findUnique({ where: { referralCode: code } });
        if (!ex) break;
        code = generateReferralCode(8);
      }
      const referralUrl = `${baseUrl.replace(/\/$/, "")}/affiliate/${code}`;
      const uniqueQrCode = getQrCodeUrl(referralUrl);
      try {
        const affiliate = await prisma.affiliate.create({
          data: {
            dealerId,
            name,
            email: row.email?.trim() || null,
            phone,
            referralCode: code,
            status: "ACTIVE",
            commissionRate: row.payoutRate != null ? Number(row.payoutRate) / 100 : null,
            payoutRate: row.payoutRate != null ? Number(row.payoutRate) / 100 : null,
            invitedAt: new Date(),
            uniqueQrCode,
          },
        });
        sendInviteEmail(affiliate, dealer || {}, referralUrl).catch(() => {});
        sendInviteSms(affiliate, dealer || {}, referralUrl).catch(() => {});
        created.push({ id: affiliate.id, name: affiliate.name, referralCode: affiliate.referralCode });
      } catch (err) {
        errors.push({ index: i, error: err.message || "Create failed" });
      }
    }
    res.status(201).json({ created, errors });
  } catch (e) {
    console.error("Bulk invite error:", e);
    res.status(500).json({ error: "Failed to bulk invite" });
  }
});

// POST /api/affiliates/:id/mark-paid — record payout (increment totalPaid, create AffiliatePayout)
affiliatesRouter.post("/:id/mark-paid", async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const { amount, reference, notes } = req.body || {};
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ error: "Valid amount required" });
    }
    const affiliate = await prisma.affiliate.findFirst({
      where: { id: req.params.id, dealerId },
    });
    if (!affiliate) return res.status(404).json({ error: "Affiliate not found" });

    const now = new Date();
    const periodEnd = new Date(now);
    const periodStart = new Date(now);
    periodStart.setMonth(periodStart.getMonth() - 1);

    await prisma.affiliatePayout.create({
      data: {
        affiliateId: affiliate.id,
        amount: value,
        method: affiliate.payoutMethod || "CASH",
        status: "COMPLETED",
        reference: reference || null,
        periodStart,
        periodEnd,
        paidAt: now,
        notes: notes || null,
      },
    });
    const updated = await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        totalPaid: { increment: value },
        lastPayoutAt: now,
      },
    });
    res.json(updated);
  } catch (e) {
    console.error("Mark paid error:", e);
    res.status(500).json({ error: "Failed to mark payout" });
  }
});

