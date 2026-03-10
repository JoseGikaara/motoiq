import { Router } from "express";
import rateLimit from "express-rate-limit";
import prisma from "../lib/prisma.js";
import { computeBadges } from "../services/affiliateGamification.js";
import { generateShortCode } from "../utils/referral.js";

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const affiliatePublicRouter = Router();

// GET /api/public/affiliate/:code/cars — dealer cars an affiliate can promote
affiliatePublicRouter.get("/:code/cars", publicLimiter, async (req, res) => {
  try {
    const code = req.params.code;
    const affiliate = await prisma.affiliate.findFirst({
      where: { referralCode: code, status: "ACTIVE" },
      select: { dealerId: true },
    });
    if (!affiliate) return res.status(404).json({ error: "Affiliate not found" });

    const cars = await prisma.car.findMany({
      where: { dealerId: affiliate.dealerId, status: "active" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        price: true,
        mileage: true,
        photos: true,
      },
      take: 30,
    });

    res.json({ cars });
  } catch (e) {
    console.error("Public affiliate cars error:", e);
    res.status(500).json({ error: "Failed to load cars" });
  }
});

// GET /api/public/affiliate/:code/referrals — recent referrals for performance table
affiliatePublicRouter.get("/:code/referrals", publicLimiter, async (req, res) => {
  try {
    const code = req.params.code;
    const affiliate = await prisma.affiliate.findFirst({
      where: { referralCode: code, status: "ACTIVE" },
      select: { id: true },
    });
    if (!affiliate) return res.status(404).json({ error: "Affiliate not found" });

    const [leads, events] = await Promise.all([
      prisma.lead.findMany({
        where: { affiliateId: affiliate.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          car: { select: { make: true, model: true, year: true, price: true } },
        },
      }),
      prisma.referralEvent.groupBy({
        by: ["leadId"],
        where: { affiliateId: affiliate.id, eventType: "closed" },
        _sum: { value: true },
      }),
    ]);

    const commissionByLead = Object.fromEntries(
      events.map((e) => [e.leadId, Number(e._sum.value ?? 0)])
    );

    const referrals = leads.map((l) => ({
      id: l.id,
      buyerName: l.name,
      carLabel: l.car ? `${l.car.year} ${l.car.make} ${l.car.model}` : "—",
      status: l.status,
      commission: commissionByLead[l.id] ?? 0,
      date: l.createdAt,
    }));

    res.json({ referrals });
  } catch (e) {
    console.error("Public affiliate referrals error:", e);
    res.status(500).json({ error: "Failed to load referrals" });
  }
});

// GET /api/public/affiliate/:code — public stats for an affiliate
affiliatePublicRouter.get("/:code", publicLimiter, async (req, res) => {
  try {
    const code = req.params.code;
    const affiliate = await prisma.affiliate.findFirst({
      where: { referralCode: code, status: "ACTIVE" },
      include: {
        dealer: {
          select: {
            id: true,
            dealershipName: true,
            city: true,
            websiteSlug: true,
            heroImage: true,
            primaryColor: true,
          },
        },
      },
    });
    if (!affiliate) return res.status(404).json({ error: "Affiliate not found" });

    const [leadCount, closedCount, events, sampleCars] = await Promise.all([
      prisma.lead.count({ where: { affiliateId: affiliate.id } }),
      prisma.lead.count({ where: { affiliateId: affiliate.id, status: "CLOSED" } }),
      prisma.referralEvent.findMany({
        where: { affiliateId: affiliate.id },
        select: { eventType: true, value: true },
      }),
      prisma.car.findMany({
        where: { dealerId: affiliate.dealerId, status: "active" },
        take: 6,
        orderBy: { createdAt: "desc" },
        select: { id: true, make: true, model: true, year: true, price: true, photos: true },
      }),
    ]);

    let testDriveCount = 0;
    let earned = 0;
    for (const e of events) {
      if (e.eventType === "test_drive") testDriveCount += 1;
      if (e.value != null) earned += Number(e.value);
    }

    const balance = Number(affiliate.totalEarned ?? 0) - Number(affiliate.totalPaid ?? 0);
    let payouts = [];
    let links = [];
    let challenges = [];
    let materials = [];
    try {
      [payouts, links, challenges, materials] = await Promise.all([
        prisma.affiliatePayout.findMany({
          where: { affiliateId: affiliate.id },
          orderBy: { paidAt: "desc" },
          take: 20,
        }),
        prisma.affiliateLink.findMany({
          where: { affiliateId: affiliate.id, isActive: true },
          orderBy: { lastClickedAt: "desc" },
        }),
        prisma.affiliateChallenge.findMany({
          where: {
            dealerId: affiliate.dealerId,
            isActive: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
          include: {
            progress: { where: { affiliateId: affiliate.id } },
          },
        }),
        prisma.dealerAffiliateMaterial.findMany({
          where: { dealerId: affiliate.dealerId },
          orderBy: { displayOrder: "asc" },
        }),
      ]);
    } catch (err) {
      console.error("Affiliate public extra data error (run migrations if needed):", err.message);
    }

    let badges = [];
    try {
      badges = computeBadges(affiliate);
    } catch (err) {
      console.error("Affiliate badges error:", err.message);
    }
    const baseUrl = req.protocol + "://" + req.get("host");
    const shortBase = process.env.BASE_URL || baseUrl;

    res.json({
      affiliate: {
        name: affiliate.name,
        referralCode: affiliate.referralCode,
        phone: affiliate.phone,
        email: affiliate.email,
        tier: affiliate.tier,
        totalEarned: affiliate.totalEarned != null ? Number(affiliate.totalEarned) : 0,
        totalPaid: affiliate.totalPaid != null ? Number(affiliate.totalPaid) : 0,
        balance: Math.max(0, balance),
        minimumPayout: affiliate.minimumPayout != null ? Number(affiliate.minimumPayout) : 1000,
        uniqueQrCode: affiliate.uniqueQrCode,
        lifetimeLeads: affiliate.lifetimeLeads ?? 0,
        lifetimeTestDrives: affiliate.lifetimeTestDrives ?? 0,
        lifetimeClosedDeals: affiliate.lifetimeClosedDeals ?? 0,
      },
      dealer: affiliate.dealer,
      stats: {
        leads: leadCount,
        testDrives: testDriveCount,
        closedDeals: closedCount,
        estimatedCommission: earned,
      },
      cars: sampleCars,
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        paidAt: p.paidAt,
      })),
      badges,
      challenges: challenges.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        targetType: c.targetType,
        targetValue: c.targetValue,
        rewardDescription: c.rewardDescription,
        endDate: c.endDate,
        progress: c.progress[0] ? { currentValue: c.progress[0].currentValue, completedAt: c.progress[0].completedAt } : { currentValue: 0, completedAt: null },
      })),
      links: links.map((l) => ({
        id: l.id,
        url: l.url,
        shortCode: l.shortCode,
        shortUrl: `${shortBase.replace(/\/$/, "")}/go/${l.shortCode}`,
        clicks: l.clicks,
        leadsGenerated: l.leadsGenerated,
        testDrivesBooked: l.testDrivesBooked,
        dealsClosed: l.dealsClosed,
      })),
      materials: materials.map((m) => ({ id: m.id, name: m.name, type: m.type, url: m.url })),
    });
  } catch (e) {
    console.error("Public affiliate error:", e);
    res.status(500).json({ error: "Failed to load affiliate" });
  }
});

// POST /api/public/affiliate/:code/links — create tracking link (returns short URL)
affiliatePublicRouter.post("/:code/links", publicLimiter, async (req, res) => {
  try {
    const code = req.params.code;
    const { carId, customSlug, utmSource, utmMedium, utmCampaign } = req.body || {};
    const affiliate = await prisma.affiliate.findFirst({
      where: { referralCode: code, status: "ACTIVE" },
      include: { dealer: { select: { websiteSlug: true } } },
    });
    if (!affiliate) return res.status(404).json({ error: "Affiliate not found" });
    const frontOrigin = process.env.FRONTEND_URL || req.protocol + "://" + req.get("host");
    let path = affiliate.dealer?.websiteSlug
      ? `/s/${affiliate.dealer.websiteSlug}`
      : "/";
    if (carId) path = affiliate.dealer?.websiteSlug ? `/s/${affiliate.dealer.websiteSlug}/car/${carId}` : `/car/${carId}`;
    const params = new URLSearchParams();
    params.set("ref", affiliate.referralCode);
    if (utmSource) params.set("utm_source", utmSource);
    if (utmMedium) params.set("utm_medium", utmMedium);
    if (utmCampaign) params.set("utm_campaign", utmCampaign);
    const url = `${frontOrigin.replace(/\/$/, "")}${path}${params.toString() ? "?" + params.toString() : ""}`;
    let shortCode;
    for (let i = 0; i < 5; i++) {
      shortCode = generateShortCode(6);
      const existing = await prisma.affiliateLink.findUnique({ where: { shortCode } });
      if (!existing) break;
    }
    if (!shortCode) shortCode = generateShortCode(8);
    const link = await prisma.affiliateLink.create({
      data: {
        affiliateId: affiliate.id,
        dealerId: affiliate.dealerId,
        carId: carId || null,
        customSlug: customSlug || null,
        url,
        shortCode,
        utmParams: [utmSource, utmMedium, utmCampaign].some(Boolean) ? { utmSource, utmMedium, utmCampaign } : null,
      },
    });
    const shortBase = process.env.BASE_URL || req.protocol + "://" + req.get("host");
    res.status(201).json({
      id: link.id,
      url: link.url,
      shortCode: link.shortCode,
      shortUrl: `${shortBase.replace(/\/$/, "")}/go/${link.shortCode}`,
    });
  } catch (e) {
    console.error("Create link error:", e);
    res.status(500).json({ error: "Failed to create link" });
  }
});

// POST /api/public/affiliate/:code/request-payout — affiliate requests payout (creates PENDING)
affiliatePublicRouter.post("/:code/request-payout", publicLimiter, async (req, res) => {
  try {
    const code = req.params.code;
    const { amount } = req.body || {};
    const affiliate = await prisma.affiliate.findFirst({
      where: { referralCode: code, status: "ACTIVE" },
    });
    if (!affiliate) return res.status(404).json({ error: "Affiliate not found" });
    const balance = Number(affiliate.totalEarned ?? 0) - Number(affiliate.totalPaid ?? 0);
    const minPayout = Number(affiliate.minimumPayout ?? 1000);
    const requestAmount = Number(amount);
    if (!Number.isFinite(requestAmount) || requestAmount < minPayout || requestAmount > balance) {
      return res.status(400).json({
        error: `Amount must be between KES ${minPayout} and KES ${balance}`,
      });
    }
    const now = new Date();
    const periodEnd = new Date(now);
    const periodStart = new Date(now);
    periodStart.setMonth(periodStart.getMonth() - 1);
    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId: affiliate.id,
        amount: requestAmount,
        method: affiliate.payoutMethod || "CASH",
        status: "PENDING",
        periodStart,
        periodEnd,
      },
    });
    res.status(201).json({
      id: payout.id,
      amount: Number(payout.amount),
      status: payout.status,
      message: "Payout request submitted. The dealer will process it shortly.",
    });
  } catch (e) {
    console.error("Payout request error:", e);
    res.status(500).json({ error: "Failed to request payout" });
  }
});

