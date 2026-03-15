import { Router } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const demoRouter = Router();

/**
 * POST /api/demo/setup
 * Requires: DATABASE_URL, DIRECT_URL (Prisma), JWT_SECRET.
 * Demo dealer must exist — run `npm run seed:demo` in server/ first.
 */
demoRouter.post("/setup", async (req, res) => {
  const email = "demo@motoriq.co.ke";
  const isDev = process.env.NODE_ENV !== "production";

  try {
    // Step 1: Find demo dealer (must exist — run npm run seed:demo in server/ first)
    let dealer;
    try {
      dealer = await prisma.dealer.findUnique({ where: { email } });
    } catch (dbError) {
      console.error("Demo setup error: prisma.dealer.findUnique failed", dbError);
      return res.status(500).json({
        error: "Demo setup failed",
        detail: isDev ? (dbError?.message || String(dbError)) : undefined,
      });
    }

    if (!dealer) {
      console.error("Demo setup error: Demo dealer not found. Run `npm run seed:demo` in the server directory.");
      return res.status(500).json({
        error: "Demo dealer not found",
        detail: isDev ? "Run `npm run seed:demo` in the server directory to create the demo account." : undefined,
      });
    }

    // Step 2: Ensure onboarding + website flags (optional update)
    const oneYearFromNow = (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d;
    })();

    if (!dealer.onboardingComplete || !dealer.websiteActive || !dealer.websiteSlug) {
      try {
        dealer = await prisma.dealer.update({
          where: { id: dealer.id },
          data: {
            onboardingComplete: true,
            websiteActive: true,
            websiteSlug: dealer.websiteSlug || "demo-showroom",
            websiteExpiresAt: dealer.websiteExpiresAt || oneYearFromNow,
          },
        });
      } catch (dbError) {
        console.error("Demo setup error: prisma.dealer.update failed", dbError);
        return res.status(500).json({
          error: "Demo setup failed",
          detail: isDev ? (dbError?.message || String(dbError)) : undefined,
        });
      }
    }

    if (!process.env.JWT_SECRET) {
      console.error("Demo setup error: JWT_SECRET is not set in environment.");
      return res.status(500).json({
        error: "Demo setup failed",
        detail: isDev ? "JWT_SECRET is not set in server .env" : undefined,
      });
    }

    const token = jwt.sign({ dealerId: dealer.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({
      dealer: {
        id: dealer.id,
        name: dealer.name,
        email: dealer.email,
        dealershipName: dealer.dealershipName,
        onboardingComplete: dealer.onboardingComplete ?? true,
        websiteSlug: dealer.websiteSlug,
        websiteActive: dealer.websiteActive,
      },
      token,
    });
  } catch (e) {
    console.error("Demo setup error:", e?.message, e);
    if (e?.stack) console.error("Demo setup stack:", e.stack);
    res.status(500).json({
      error: "Demo setup failed",
      ...(isDev && e?.message && { detail: e.message }),
    });
  }
});
