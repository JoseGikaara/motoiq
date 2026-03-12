import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import * as Sentry from "@sentry/node";
import { authRouter } from "./routes/auth.js";
import { carsRouter } from "./routes/cars.js";
import { leadsRouter } from "./routes/leads.js";
import { aiRouter } from "./routes/ai.js";
import { settingsRouter } from "./routes/settings.js";
import { showroomRouter } from "./routes/showroom.js";
import { publicSiteRouter } from "./routes/publicSite.js";
import { affiliatePublicRouter } from "./routes/affiliatePublic.js";
import { testDrivesRouter } from "./routes/testDrives.js";
import { tasksRouter } from "./routes/tasks.js";
import { reportsRouter } from "./routes/reports.js";
import { dripSequencesRouter } from "./routes/dripSequences.js";
import { todayRouter } from "./routes/today.js";
import { demoRouter } from "./routes/demo.js";
import adminRouter from "./routes/admin/index.js";
import { affiliatesRouter } from "./routes/affiliates.js";
import { uploadRouter } from "./routes/upload.js";
import { bannersRouter } from "./routes/banners.js";
import { postsRouter } from "./routes/posts.js";
import { startTasksCron } from "./cron/tasks.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// --- Sentry initialization (backend) ---
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
  app.use(Sentry.Handlers.requestHandler());
}

// --- Core middleware ---
const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "https://www.google.com", "https://www.gstatic.com"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://*.motoriq.co.ke", "http://localhost:*", "https://*.motoriq.co.ke"],
        "connect-src": ["'self'", "*"],
        "frame-ancestors": ["'self'", "https://*.motoriq.co.ke"],
      },
    },
    frameguard: { action: "sameorigin" },
    hsts: {
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: false,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);
app.use(express.json({ limit: "10mb" }));

// Optional HTTPS redirect behind proxies
app.use((req, res, next) => {
  if (process.env.ENFORCE_HTTPS === "true" && req.headers["x-forwarded-proto"] === "http") {
    const host = req.headers.host;
    return res.redirect(301, `https://${host}${req.url}`);
  }
  next();
});

// --- Routes ---
app.use("/api/auth", authRouter);
app.use("/api/cars", carsRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/today", todayRouter);
app.use("/api/showroom", showroomRouter);
app.use("/api/public/site", publicSiteRouter);
app.use("/api/public/affiliate", affiliatePublicRouter);
app.use("/api/test-drives", testDrivesRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/drip-sequences", dripSequencesRouter);
app.use("/api/demo", demoRouter);
app.use("/api/admin", adminRouter);
app.use("/api/affiliates", affiliatesRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/banners", bannersRouter);
app.use("/api/posts", postsRouter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Buyer referral link: redirect to car page with buyerRef so lead can be attributed
app.get("/go/buyer-ref/:carId/:refCode", async (req, res) => {
  try {
    const prisma = (await import("./lib/prisma.js")).default;
    const car = await prisma.car.findUnique({
      where: { id: req.params.carId },
      select: { id: true },
    });
    if (!car) return res.status(404).send("Car not found");
    const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
    const refCode = (req.params.refCode || "").trim();
    const qs = refCode ? `?buyerRef=${encodeURIComponent(refCode)}` : "";
    return res.redirect(302, `${baseUrl.replace(/\/$/, "")}/car/${req.params.carId}${qs}`);
  } catch (e) {
    console.error("Go buyer-ref redirect error:", e);
    res.status(500).send("Error");
  }
});

// Shareable car link: log click then redirect to car page
app.get("/go/car/:id", async (req, res) => {
  try {
    const prisma = (await import("./lib/prisma.js")).default;
    const car = await prisma.car.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!car) return res.status(404).send("Car not found");
    const referrer = req.headers.referer || req.headers.referrer || null;
    const ua = (req.headers["user-agent"] || "").toLowerCase();
    const deviceType = ua.includes("mobile") && !ua.includes("ipad") ? "mobile" : ua.includes("tablet") || ua.includes("ipad") ? "tablet" : "desktop";
    await prisma.carShareClick.create({
      data: {
        carId: car.id,
        referrer: referrer || undefined,
        deviceType,
      },
    });
    const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
    return res.redirect(302, `${baseUrl.replace(/\/$/, "")}/car/${req.params.id}`);
  } catch (e) {
    console.error("Go car redirect error:", e);
    res.status(500).send("Error");
  }
});

// Affiliate car link: /go/:affiliateCode/:carId — track click, redirect to car page with ref for lead attribution
app.get("/go/:affiliateCode/:carId", async (req, res) => {
  try {
    const prisma = (await import("./lib/prisma.js")).default;
    const affiliateCode = (req.params.affiliateCode || "").trim();
    const carId = (req.params.carId || "").trim();
    if (!affiliateCode || !carId) return res.status(404).send("Not found");
    const affiliate = await prisma.affiliate.findFirst({
      where: { referralCode: affiliateCode, status: "ACTIVE" },
      select: { id: true, dealerId: true },
    });
    if (!affiliate) return res.status(404).send("Affiliate not found");
    const car = await prisma.car.findFirst({
      where: { id: carId, dealerId: affiliate.dealerId },
      select: { id: true },
    });
    if (!car) return res.status(404).send("Car not found");
    await prisma.referralEvent.create({
      data: { affiliateId: affiliate.id, eventType: "click", leadId: null },
    }).catch(() => {});
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await prisma.affiliatePerformance.upsert({
      where: {
        affiliateId_performanceDate: { affiliateId: affiliate.id, performanceDate: today },
      },
      update: { linkClicks: { increment: 1 } },
      create: {
        affiliateId: affiliate.id,
        performanceDate: today,
        linkClicks: 1,
      },
    }).catch(() => {});
    const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
    const qs = `?ref=${encodeURIComponent(affiliateCode)}`;
    return res.redirect(302, `${baseUrl.replace(/\/$/, "")}/car/${carId}${qs}`);
  } catch (e) {
    console.error("Go affiliate car redirect error:", e);
    res.status(500).send("Error");
  }
});

// Public redirect for affiliate short links (track click then redirect)
app.get("/go/:shortCode", async (req, res) => {
  try {
    const prisma = (await import("./lib/prisma.js")).default;
    const link = await prisma.affiliateLink.findUnique({
      where: { shortCode: req.params.shortCode.toUpperCase(), isActive: true },
    });
    if (!link) return res.status(404).send("Link not found or inactive");
    if (link.expiresAt && new Date() > link.expiresAt) return res.status(404).send("Link expired");
    await prisma.affiliateLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 }, lastClickedAt: new Date() },
    });
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await prisma.affiliatePerformance.upsert({
      where: {
        affiliateId_performanceDate: { affiliateId: link.affiliateId, performanceDate: today },
      },
      update: { linkClicks: { increment: 1 } },
      create: {
        affiliateId: link.affiliateId,
        performanceDate: today,
        linkClicks: 1,
      },
    });
    return res.redirect(302, link.url);
  } catch (e) {
    console.error("Go redirect error:", e);
    res.status(500).send("Error");
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// --- Sentry error handler (must be after all routes) ---
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

startTasksCron();

app.listen(PORT, () => console.log(`MotorIQ server running on http://localhost:${PORT}`));
