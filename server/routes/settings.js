import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get("/", async (req, res) => {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { id: req.dealer.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dealershipName: true,
        logoUrl: true,
        primaryColor: true,
        tagline: true,
        city: true,
        website: true,
        monthlyTargetDeals: true,
        commissionRate: true,
        currency: true,
        affiliateCommissionMode: true,
        affiliateCommissionPerLead: true,
        affiliateCommissionPerTestDrive: true,
        affiliateCommissionPerClose: true,
        affiliateMultiLevelDepth: true,
        affiliateLevel2Rate: true,
        affiliateLevel3Rate: true,
        websiteSlug: true,
        websiteActive: true,
        websiteExpiresAt: true,
        customDomain: true,
        heroImage: true,
        aboutText: true,
        financingOffers: true,
        enableDiscountMarquee: true,
        enableVideoBackgrounds: true,
      },
    });
    if (!dealer) return res.status(404).json({ error: "Not found" });
    res.json(dealer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/** GET /api/settings/incentive — closed this month, target, rate for dashboard widget */
settingsRouter.get("/incentive", async (req, res) => {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { id: req.dealer.id },
      select: { monthlyTargetDeals: true, commissionRate: true, currency: true },
    });
    if (!dealer) return res.status(404).json({ error: "Not found" });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const closedThisMonth = await prisma.lead.count({
      where: {
        dealerId: req.dealer.id,
        status: "CLOSED",
        updatedAt: { gte: startOfMonth },
      },
    });

    const agg = await prisma.lead.aggregate({
      where: {
        dealerId: req.dealer.id,
        status: "CLOSED",
        updatedAt: { gte: startOfMonth },
      },
      _sum: { dealValue: true },
    });
    const totalValueThisMonth = Number(agg._sum.dealValue ?? 0);

    res.json({
      closedThisMonth,
      totalValueThisMonth,
      monthlyTargetDeals: dealer.monthlyTargetDeals ?? null,
      commissionRate: dealer.commissionRate != null ? Number(dealer.commissionRate) : null,
      currency: dealer.currency ?? "KES",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch incentive" });
  }
});

/** Generate URL-safe slug from dealership name; ensure unique by appending suffix if needed */
async function ensureWebsiteSlug(dealershipName, excludeDealerId = null) {
  const base = dealershipName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "dealer";
  let slug = base;
  let n = 0;
  for (;;) {
    const existing = await prisma.dealer.findFirst({
      where: {
        websiteSlug: slug,
        ...(excludeDealerId ? { id: { not: excludeDealerId } } : {}),
      },
    });
    if (!existing) return slug;
    slug = `${base}-${++n}`;
  }
}

settingsRouter.patch("/", async (req, res) => {
  try {
    const {
      name,
      phone,
      dealershipName,
      logoUrl,
      primaryColor,
      tagline,
      city,
      website,
      monthlyTargetDeals,
      commissionRate,
      currency,
      affiliateCommissionMode,
      affiliateCommissionPerLead,
      affiliateCommissionPerTestDrive,
      affiliateCommissionPerClose,
      affiliateMultiLevelDepth,
      affiliateLevel2Rate,
      affiliateLevel3Rate,
      websiteActive,
      customDomain,
      heroImage,
      aboutText,
      financingOffers,
      enableDiscountMarquee,
      enableVideoBackgrounds,
    } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (dealershipName !== undefined) data.dealershipName = dealershipName;
    if (logoUrl !== undefined) data.logoUrl = logoUrl;
    if (primaryColor !== undefined) data.primaryColor = primaryColor;
    if (tagline !== undefined) data.tagline = tagline;
    if (city !== undefined) data.city = city;
    if (website !== undefined) data.website = website;
    if (monthlyTargetDeals !== undefined) data.monthlyTargetDeals = monthlyTargetDeals == null ? null : Number(monthlyTargetDeals);
    if (commissionRate !== undefined) data.commissionRate = commissionRate == null ? null : Number(commissionRate);
    if (currency !== undefined) data.currency = currency;
    if (affiliateCommissionMode !== undefined)
      data.affiliateCommissionMode = affiliateCommissionMode === "fixed" ? "fixed" : "percent";
    if (affiliateCommissionPerLead !== undefined)
      data.affiliateCommissionPerLead = affiliateCommissionPerLead == null || affiliateCommissionPerLead === "" ? null : Math.max(0, Number(affiliateCommissionPerLead));
    if (affiliateCommissionPerTestDrive !== undefined)
      data.affiliateCommissionPerTestDrive = affiliateCommissionPerTestDrive == null || affiliateCommissionPerTestDrive === "" ? null : Math.max(0, Number(affiliateCommissionPerTestDrive));
    if (affiliateCommissionPerClose !== undefined)
      data.affiliateCommissionPerClose = affiliateCommissionPerClose == null || affiliateCommissionPerClose === "" ? null : Math.max(0, Number(affiliateCommissionPerClose));
    if (affiliateMultiLevelDepth !== undefined)
      data.affiliateMultiLevelDepth = affiliateMultiLevelDepth == null || affiliateMultiLevelDepth === "" ? null : Math.min(3, Math.max(1, Number(affiliateMultiLevelDepth) || 1));
    if (affiliateLevel2Rate !== undefined)
      data.affiliateLevel2Rate = affiliateLevel2Rate == null || affiliateLevel2Rate === "" ? null : Math.max(0, Math.min(1, Number(affiliateLevel2Rate)));
    if (affiliateLevel3Rate !== undefined)
      data.affiliateLevel3Rate = affiliateLevel3Rate == null || affiliateLevel3Rate === "" ? null : Math.max(0, Math.min(1, Number(affiliateLevel3Rate)));
    if (customDomain !== undefined) data.customDomain = customDomain === "" ? null : customDomain;
    if (heroImage !== undefined) data.heroImage = heroImage === "" ? null : heroImage;
    if (aboutText !== undefined) data.aboutText = aboutText === "" ? null : aboutText;
    if (financingOffers !== undefined) {
      const arr = Array.isArray(financingOffers) ? financingOffers : null;
      data.financingOffers = arr?.length ? arr.map((o) => ({
        name: String(o.name ?? "").trim() || "Financing",
        ratePct: Math.max(0, Math.min(100, Number(o.ratePct) || 0)),
        termMonths: o.termMonths != null && o.termMonths !== "" ? Number(o.termMonths) : null,
        termMin: o.termMin != null && o.termMin !== "" ? Number(o.termMin) : null,
        termMax: o.termMax != null && o.termMax !== "" ? Number(o.termMax) : null,
        minDepositPct: o.minDepositPct != null && o.minDepositPct !== "" ? Number(o.minDepositPct) : null,
        notes: o.notes ? String(o.notes).trim() : null,
      })) : [];
    }
    if (enableDiscountMarquee !== undefined) data.enableDiscountMarquee = Boolean(enableDiscountMarquee);
    if (enableVideoBackgrounds !== undefined) data.enableVideoBackgrounds = Boolean(enableVideoBackgrounds);

    const current = await prisma.dealer.findUnique({
      where: { id: req.dealer.id },
      select: { websiteSlug: true, websiteActive: true, websiteExpiresAt: true, dealershipName: true },
    });

    if (websiteActive === true && current) {
      if (!current.websiteSlug) {
        data.websiteSlug = await ensureWebsiteSlug(current.dealershipName, req.dealer.id);
      }
      if (!current.websiteExpiresAt) {
        const oneYear = new Date();
        oneYear.setFullYear(oneYear.getFullYear() + 1);
        data.websiteExpiresAt = oneYear;
      }
    }
    if (websiteActive !== undefined) data.websiteActive = Boolean(websiteActive);

    const dealer = await prisma.dealer.update({
      where: { id: req.dealer.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dealershipName: true,
        logoUrl: true,
        primaryColor: true,
        tagline: true,
        city: true,
        website: true,
        monthlyTargetDeals: true,
        commissionRate: true,
        currency: true,
        affiliateCommissionMode: true,
        affiliateCommissionPerLead: true,
        affiliateCommissionPerTestDrive: true,
        affiliateCommissionPerClose: true,
        affiliateMultiLevelDepth: true,
        affiliateLevel2Rate: true,
        affiliateLevel3Rate: true,
        websiteSlug: true,
        websiteActive: true,
        websiteExpiresAt: true,
        customDomain: true,
        heroImage: true,
        aboutText: true,
        financingOffers: true,
        enableDiscountMarquee: true,
        enableVideoBackgrounds: true,
      },
    });
    res.json(dealer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update settings" });
  }
});
