import { Router } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const demoRouter = Router();

// POST /api/demo/setup — ensure demo dealer exists (seed script should be run once in deployments)
demoRouter.post("/setup", async (req, res) => {
  const email = "demo@motoriq.co.ke";
  const isDev = process.env.NODE_ENV !== "production";

  try {
    let dealer = await prisma.dealer.findUnique({ where: { email } });
    if (!dealer) {
      return res.status(500).json({
        error: "Demo dealer not found",
        detail: isDev ? "Run `npm run seed:demo` in the server directory to create the demo account." : undefined,
      });
    }

    // Ensure onboarding + website flags are correct even if seed was older
    const oneYearFromNow = (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d;
    })();

    if (!dealer.onboardingComplete || !dealer.websiteActive || !dealer.websiteSlug) {
      dealer = await prisma.dealer.update({
        where: { id: dealer.id },
        data: {
          onboardingComplete: true,
          websiteActive: true,
          websiteSlug: dealer.websiteSlug || "demo-showroom",
          websiteExpiresAt: dealer.websiteExpiresAt || oneYearFromNow,
        },
      });
    }

    if (!process.env.JWT_SECRET) {
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
    console.error("Demo setup error:", e);
    res.status(500).json({
      error: "Demo setup failed",
      ...(isDev && e?.message && { detail: e.message }),
    });
  }
});
