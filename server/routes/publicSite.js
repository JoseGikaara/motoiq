/**
 * Public dealer website API (no auth).
 * Resolves dealer by slug (path) or by host (subdomain / custom domain).
 */
import { Router } from "express";
import rateLimit from "express-rate-limit";
import prisma from "../lib/prisma.js";
import { verifyCaptchaToken } from "../utils/verifyCaptcha.js";
import { notifyDealer } from "../utils/notify.js";
import { getClientIp } from "../utils/activityLog.js";

const DEALER_SELECT = {
  id: true,
  dealershipName: true,
  phone: true,
  logoUrl: true,
  primaryColor: true,
  tagline: true,
  city: true,
  website: true,
  websiteSlug: true,
  websiteActive: true,
  websiteExpiresAt: true,
  customDomain: true,
  heroImage: true,
  aboutText: true,
  financingOffers: true,
  enableDiscountMarquee: true,
  enableVideoBackgrounds: true,
};

/** True if dealer's public website is active and not expired */
function isWebsiteLive(dealer) {
  if (!dealer?.websiteActive) return false;
  if (dealer.websiteExpiresAt && new Date(dealer.websiteExpiresAt) < new Date()) return false;
  return true;
}

/** Resolve dealer by slug (for path-based URLs like /s/my-dealer) */
export async function getDealerBySlug(slug) {
  const dealer = await prisma.dealer.findUnique({
    where: { websiteSlug: slug },
    select: DEALER_SELECT,
  });
  return dealer && isWebsiteLive(dealer) ? dealer : null;
}

/** Resolve dealer by hostname: subdomain (e.g. mydealer.motoriq.co.ke) or custom domain */
export function getDealerByHost(hostname) {
  if (!hostname) return null;
  const baseHost = process.env.PUBLIC_SITE_BASE_HOST || "motoriq.co.ke";
  const isSubdomain = hostname.endsWith(`.${baseHost}`) && hostname !== baseHost;
  const subdomain = isSubdomain ? hostname.slice(0, -baseHost.length - 1) : null;
  return { subdomain, isCustomDomain: !isSubdomain && hostname !== baseHost, hostname };
}

export const publicSiteRouter = Router();

/** GET /api/public/site/by-slug/:slug — dealer config for path-based routing */
publicSiteRouter.get("/by-slug/:slug", async (req, res) => {
  try {
    const dealer = await getDealerBySlug(req.params.slug);
    if (!dealer) return res.status(404).json({ error: "Dealer website not found or inactive" });
    res.json(dealer);
  } catch (e) {
    console.error("Public site by-slug error:", e?.message, e?.stack || e);
    const msg =
      process.env.NODE_ENV !== "production" && e?.message
        ? e.message
        : "Failed to fetch site";
    res.status(500).json({ error: msg });
  }
});

/** GET /api/public/site/by-host?host= — resolve dealer from subdomain or custom domain */
publicSiteRouter.get("/by-host", async (req, res) => {
  try {
    const host = req.query.host || req.get("host") || "";
    const { subdomain, isCustomDomain, hostname } = getDealerByHost(host);
    let dealer = null;
    if (subdomain) {
      dealer = await getDealerBySlug(subdomain);
    } else if (isCustomDomain && hostname) {
      dealer = await prisma.dealer.findFirst({
        where: { customDomain: hostname, websiteActive: true },
        select: DEALER_SELECT,
      });
      if (dealer && !isWebsiteLive(dealer)) dealer = null;
    }
    if (!dealer) return res.status(404).json({ error: "Dealer website not found or inactive" });
    res.json(dealer);
  } catch (e) {
    console.error("Public site by-host error:", e);
    const msg = process.env.NODE_ENV !== "production" && e?.message ? e.message : "Failed to resolve site";
    res.status(500).json({ error: msg });
  }
});

/** GET /api/public/site/:slug/cars — inventory list (filters: minPrice, maxPrice, make, year, maxMileage) */
publicSiteRouter.get("/:slug/cars", async (req, res) => {
  try {
    const dealer = await getDealerBySlug(req.params.slug);
    if (!dealer) return res.status(404).json({ error: "Dealer website not found or inactive" });
    const { minPrice, maxPrice, make, year, maxMileage } = req.query;
    const where = { dealerId: dealer.id, status: "active" };
    const minP = minPrice != null && minPrice !== "" ? Number(minPrice) : NaN;
    const maxP = maxPrice != null && maxPrice !== "" ? Number(maxPrice) : NaN;
    if (!Number.isNaN(minP)) where.price = { ...where.price, gte: minP };
    if (!Number.isNaN(maxP)) where.price = { ...where.price, lte: maxP };
    if (make && String(make).trim()) where.make = { equals: String(make).trim(), mode: "insensitive" };
    const yearNum = year != null && year !== "" ? Number(year) : NaN;
    if (!Number.isNaN(yearNum)) where.year = yearNum;
    const maxM = maxMileage != null && maxMileage !== "" ? Number(maxMileage) : NaN;
    if (!Number.isNaN(maxM)) where.mileage = { lte: maxM };
    const cars = await prisma.car.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
    });
    res.json(cars);
  } catch (e) {
    console.error("Public site cars error:", e);
    const msg = process.env.NODE_ENV !== "production" && e?.message ? e.message : "Failed to fetch inventory";
    res.status(500).json({ error: msg });
  }
});

/** GET /api/public/site/:slug/banners — active banners for dealer website */
publicSiteRouter.get("/:slug/banners", async (req, res) => {
  try {
    const dealer = await getDealerBySlug(req.params.slug);
    if (!dealer) return res.status(404).json({ error: "Dealer website not found or inactive" });
    const now = new Date();
    const banners = await prisma.dealerBanner.findMany({
      where: {
        dealerId: dealer.id,
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { displayOrder: "asc" },
    });
    res.json(banners);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
});

/** GET /api/public/site/:slug/cars/:carId — single car (must belong to dealer) */
publicSiteRouter.get("/:slug/cars/:carId", async (req, res) => {
  try {
    const dealer = await getDealerBySlug(req.params.slug);
    if (!dealer) return res.status(404).json({ error: "Dealer website not found or inactive" });
    const car = await prisma.car.findFirst({
      where: { id: req.params.carId, dealerId: dealer.id, status: "active" },
      include: { carPhotos: { orderBy: [{ displayOrder: "asc" }] } },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    res.json(car);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch car" });
  }
});

/** POST /api/public/site/:slug/trade-in — submit trade-in request (no auth, rate limited, captcha) */
const tradeInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
publicSiteRouter.post("/:slug/trade-in", tradeInLimiter, async (req, res) => {
  try {
    const slug = req.params.slug;
    const { name, phone, email, year, make, model, mileage, condition, captchaToken } = req.body || {};
    const captchaOk = await verifyCaptchaToken(captchaToken, getClientIp(req));
    if (!captchaOk) return res.status(400).json({ error: "Captcha verification failed" });
    if (!name || !phone || !email) return res.status(400).json({ error: "Name, phone and email required" });

    const dealer = await prisma.dealer.findUnique({
      where: { websiteSlug: slug, websiteActive: true },
      select: { id: true, name: true, email: true, phone: true, dealershipName: true },
    });
    if (!dealer) return res.status(404).json({ error: "Dealer website not found or inactive" });

    const firstCar = await prisma.car.findFirst({
      where: { dealerId: dealer.id, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    if (!firstCar) return res.status(400).json({ error: "Dealer has no cars; cannot submit trade-in" });

    const tradeInNote = [year, make, model].filter(Boolean).join(" ");
    const noteParts = [`Trade-in: ${tradeInNote || "Vehicle"}`];
    if (mileage != null && mileage !== "") noteParts.push(`${mileage} km`);
    if (condition) noteParts.push(condition);
    const notes = noteParts.join(", ");

    const lead = await prisma.lead.create({
      data: {
        carId: firstCar.id,
        dealerId: dealer.id,
        name,
        phone,
        email,
        tradeIn: "yes",
        notes,
        source: `website_tradein_${slug}`,
        status: "NEW",
      },
      include: { car: { select: { make: true, model: true, year: true } } },
    });
    const fullDealer = await prisma.dealer.findUnique({
      where: { id: dealer.id },
      select: { id: true, name: true, email: true, phone: true, dealershipName: true },
    });
    notifyDealer(fullDealer, lead, firstCar).catch((err) => console.error("Notify dealer (trade-in) failed:", err));
    res.status(201).json(lead);
  } catch (e) {
    console.error("Trade-in submit error:", e);
    res.status(500).json({ error: "Failed to submit trade-in" });
  }
});

/** GET /api/public/site/:slug — same as by-slug, convenience */
publicSiteRouter.get("/:slug", async (req, res, next) => {
  if (req.params.slug === "by-slug" || req.params.slug === "by-host") return next();
  try {
    const dealer = await getDealerBySlug(req.params.slug);
    if (!dealer) return res.status(404).json({ error: "Dealer website not found or inactive" });
    res.json(dealer);
  } catch (e) {
    console.error("Public site by-slug (/:slug) error:", e);
    const msg = process.env.NODE_ENV !== "production" && e?.message ? e.message : "Failed to fetch site";
    res.status(500).json({ error: msg });
  }
});
