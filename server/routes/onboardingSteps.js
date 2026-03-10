import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

export const onboardingStepsRouter = Router();

const STEPS = ["profile", "first_car", "share_link", "complete"];

onboardingStepsRouter.use(requireAuth);

onboardingStepsRouter.get("/", async (req, res) => {
  try {
    let steps = await prisma.onboardingStep.findMany({
      where: { dealerId: req.dealer.id },
      orderBy: { id: "asc" },
    });
    const byStep = Object.fromEntries(steps.map((s) => [s.step, s]));
    const result = STEPS.map((step) => ({
      step,
      completed: byStep[step]?.completed ?? false,
      completedAt: byStep[step]?.completedAt ?? null,
    }));
    res.json(result);
  } catch (e) {
    console.error("Onboarding steps error:", e);
    res.status(500).json({ error: "Failed to load steps" });
  }
});

onboardingStepsRouter.patch("/:step/complete", async (req, res) => {
  try {
    const step = req.params.step;
    if (!STEPS.includes(step)) return res.status(400).json({ error: "Invalid step" });
    const existing = await prisma.onboardingStep.findFirst({
      where: { dealerId: req.dealer.id, step },
    });
    const now = new Date();
    if (existing) {
      await prisma.onboardingStep.update({
        where: { id: existing.id },
        data: { completed: true, completedAt: now },
      });
    } else {
      await prisma.onboardingStep.create({
        data: { dealerId: req.dealer.id, step, completed: true, completedAt: now },
      });
    }
    if (step === "complete") {
      await prisma.dealer.update({
        where: { id: req.dealer.id },
        data: { onboardingComplete: true },
      });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("Onboarding step complete error:", e);
    res.status(500).json({ error: "Failed to update step" });
  }
});
