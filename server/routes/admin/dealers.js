import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import * as onboardingEmail from "../../utils/sendOnboardingEmail.js";

const router = Router();
router.use(adminAuth);

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 10; i += 1) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function generateWebsiteSlug(dealershipName) {
  const base =
    (dealershipName || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "dealer";
  let slug = base;
  let n = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await prisma.dealer.findUnique({ where: { websiteSlug: slug } });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

router.post("/", async (req, res) => {
  try {
    const { dealerName, dealershipName, email, phone, dealershipSlug, plan, credits, domain, subdomain } = req.body;
    if (!dealerName && !dealershipName) {
      return res.status(400).json({ error: "dealerName or dealershipName is required" });
    }
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const existing = await prisma.dealer.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "A dealer with this email already exists" });
    }

    const tempPassword = randomPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);
    const name = dealerName || dealershipName;
    const dealerLabel = dealershipName || dealerName || name;

    const oneYear = new Date();
    oneYear.setFullYear(oneYear.getFullYear() + 1);

    const slug =
      (dealershipSlug || subdomain || "").trim() ||
      (await generateWebsiteSlug(dealerLabel));

    const initialCredits = typeof credits === "number" ? credits : 0;

    const dealer = await prisma.dealer.create({
      data: {
        name,
        email,
        password: hashed,
        phone: phone || null,
        dealershipName: dealerLabel,
        websiteSlug: slug,
        websiteActive: true,
        websiteExpiresAt: oneYear,
        customDomain: domain || null,
        isActive: true,
        credits: initialCredits,
      },
    });

    let subscription = null;
    if (plan) {
      const normalizedPlan =
        plan === "ENTERPRISE" || plan === "PRO" || plan === "BASIC" || plan === "TRIAL"
          ? plan
          : "BASIC";
      const amount =
        normalizedPlan === "ENTERPRISE" ? 20000 : normalizedPlan === "PRO" ? 15000 : 0;
      subscription = await prisma.subscription.create({
        data: {
          dealerId: dealer.id,
          plan: normalizedPlan,
          status: "ACTIVE",
          amount,
          notes: "Admin-created dealer",
        },
      });
    }

    onboardingEmail
      .sendAccountApproved(dealer.email, dealer.name, tempPassword)
      .catch((e) => console.error("Welcome email:", e));

    res.status(201).json({
      dealer: {
        id: dealer.id,
        name: dealer.name,
        email: dealer.email,
        dealershipName: dealer.dealershipName,
        websiteSlug: dealer.websiteSlug,
        websiteActive: dealer.websiteActive,
        customDomain: dealer.customDomain || null,
        credits: dealer.credits,
        subscription,
      },
      tempPassword,
    });
  } catch (e) {
    console.error("Admin create dealer error:", e);
    res.status(500).json({ error: "Failed to create dealer" });
  }
});

router.get("/", async (req, res) => {
  try {
    const search = req.query.search;
    const plan = req.query.plan;
    const status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const where = {};
    if (search && String(search).trim()) {
      const q = "%" + String(search).trim() + "%";
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { dealershipName: { contains: q, mode: "insensitive" } },
      ];
    }
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (plan) where.subscription = { plan };
    if (status === "suspended") where.subscription = Object.assign(where.subscription || {}, { status: "SUSPENDED" });
    if (status === "expired") where.subscription = Object.assign(where.subscription || {}, { status: "EXPIRED" });

    const [dealers, total] = await Promise.all([
      prisma.dealer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          dealershipName: true,
          phone: true,
          city: true,
          isActive: true,
          createdAt: true,
          websiteSlug: true,
          websiteActive: true,
          websiteExpiresAt: true,
          subscription: { select: { plan: true, status: true, endDate: true } },
          _count: { select: { leads: true, cars: true } },
        },
      }),
      prisma.dealer.count({ where }),
    ]);
    const list = dealers.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      dealershipName: d.dealershipName,
      phone: d.phone,
      city: d.city,
      isActive: d.isActive,
      createdAt: d.createdAt,
      subscription: d.subscription,
      websiteSlug: d.websiteSlug,
      websiteActive: d.websiteActive,
      websiteExpiresAt: d.websiteExpiresAt,
      leadCount: d._count.leads,
      carCount: d._count.cars,
      lastActive: d.createdAt,
    }));
    res.json({ dealers: list, total, page, limit });
  } catch (e) {
    console.error("Admin dealers list error:", e);
    res.status(500).json({ error: "Failed to load dealers" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        dealershipName: true,
        phone: true,
        city: true,
        website: true,
        websiteSlug: true,
        websiteActive: true,
        websiteExpiresAt: true,
        customDomain: true,
        heroImage: true,
        aboutText: true,
        primaryColor: true,
        tagline: true,
        isActive: true,
        notes: true,
        createdAt: true,
        credits: true,
        totalCreditsUsed: true,
        monthlyTargetDeals: true,
        commissionRate: true,
        currency: true,
        subscription: true,
        _count: { select: { leads: true, cars: true, testDrives: true } },
      },
    });
    if (!dealer) return res.status(404).json({ error: "Dealer not found" });
    const closedCount = await prisma.lead.count({ where: { dealerId: dealer.id, status: "CLOSED" } });
    const cars = await prisma.car.findMany({
      where: { dealerId: dealer.id },
      select: { id: true, make: true, model: true, year: true, price: true, photos: true, _count: { select: { leads: true } } },
    });
    const activityLogs = await prisma.activityLog.findMany({
      where: { dealerId: dealer.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({
      dealer: {
        ...dealer,
        leadCount: dealer._count.leads,
        carCount: dealer._count.cars,
        testDriveCount: dealer._count.testDrives,
        closedDeals: closedCount,
      },
      cars: cars.map((c) => ({ id: c.id, make: c.make, model: c.model, year: c.year, price: c.price, photos: c.photos, leadCount: c._count.leads })),
      activityLogs,
    });
  } catch (e) {
    console.error("Admin dealer detail error:", e);
    res.status(500).json({ error: "Failed to load dealer" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const body = req.body;
    const data = {};
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.dealershipName !== undefined) data.dealershipName = body.dealershipName;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.websiteActive !== undefined) data.websiteActive = Boolean(body.websiteActive);
    if (body.websiteSlug !== undefined) data.websiteSlug = body.websiteSlug || null;
    if (body.websiteExpiresAt !== undefined) {
      data.websiteExpiresAt = body.websiteExpiresAt ? new Date(body.websiteExpiresAt) : null;
    }
    if (body.customDomain !== undefined) data.customDomain = body.customDomain || null;
    if (body.heroImage !== undefined) data.heroImage = body.heroImage || null;
    if (body.aboutText !== undefined) data.aboutText = body.aboutText || null;
    if (body.primaryColor !== undefined) data.primaryColor = body.primaryColor || null;
    if (body.tagline !== undefined) data.tagline = body.tagline || null;
    if (body.credits !== undefined && Number.isFinite(Number(body.credits))) {
      data.credits = Number(body.credits);
    }
    if (body.totalCreditsUsed !== undefined && Number.isFinite(Number(body.totalCreditsUsed))) {
      data.totalCreditsUsed = Number(body.totalCreditsUsed);
    }
    if (body.monthlyTargetDeals !== undefined) {
      data.monthlyTargetDeals =
        body.monthlyTargetDeals === null || body.monthlyTargetDeals === ""
          ? null
          : Number(body.monthlyTargetDeals);
    }
    if (body.commissionRate !== undefined) {
      data.commissionRate =
        body.commissionRate === null || body.commissionRate === ""
          ? null
          : Number(body.commissionRate);
    }
    if (body.currency !== undefined) data.currency = body.currency;
    const dealer = await prisma.dealer.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        dealershipName: true,
        isActive: true,
        notes: true,
        phone: true,
        websiteSlug: true,
        websiteActive: true,
        websiteExpiresAt: true,
        customDomain: true,
        heroImage: true,
        aboutText: true,
        primaryColor: true,
        tagline: true,
        credits: true,
        totalCreditsUsed: true,
        monthlyTargetDeals: true,
        commissionRate: true,
        currency: true,
      },
    });
    res.json(dealer);
  } catch (e) {
    console.error("Admin dealer update error:", e);
    res.status(500).json({ error: "Failed to update dealer" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.dealer.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ ok: true });
  } catch (e) {
    console.error("Admin dealer delete error:", e);
    res.status(500).json({ error: "Failed to deactivate dealer" });
  }
});

router.post("/:id/suspend", async (req, res) => {
  try {
    await prisma.dealer.update({ where: { id: req.params.id }, data: { isActive: false } });
    await prisma.subscription.updateMany({ where: { dealerId: req.params.id }, data: { status: "SUSPENDED" } });
    res.json({ ok: true });
  } catch (e) {
    console.error("Admin suspend error:", e);
    res.status(500).json({ error: "Failed to suspend" });
  }
});

router.post("/:id/activate", async (req, res) => {
  try {
    await prisma.dealer.update({ where: { id: req.params.id }, data: { isActive: true } });
    await prisma.subscription.updateMany({ where: { dealerId: req.params.id }, data: { status: "ACTIVE" } });
    res.json({ ok: true });
  } catch (e) {
    console.error("Admin activate error:", e);
    res.status(500).json({ error: "Failed to activate" });
  }
});

export default router;
