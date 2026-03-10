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
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
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
  // Ensure unique across dealers
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await prisma.dealer.findUnique({ where: { websiteSlug: slug } });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

router.get("/", async (req, res) => {
  try {
    const status = req.query.status;
    const where = status ? { status } : {};
    const list = await prisma.onboardingApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { dealer: { select: { id: true, email: true, dealershipName: true } } },
    });
    res.json(list);
  } catch (e) {
    console.error("Admin applications list:", e);
    res.status(500).json({ error: "Failed to load applications" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const app = await prisma.onboardingApplication.findUnique({
      where: { id: req.params.id },
      include: { dealer: { select: { id: true, email: true, dealershipName: true } } },
    });
    if (!app) return res.status(404).json({ error: "Application not found" });
    res.json(app);
  } catch (e) {
    console.error("Admin application detail:", e);
    res.status(500).json({ error: "Failed to load application" });
  }
});

router.patch("/:id/payment", async (req, res) => {
  try {
    const { paymentStatus, notes } = req.body;
    if (!paymentStatus || !["CONFIRMED", "REJECTED"].includes(paymentStatus)) {
      return res.status(400).json({ error: "paymentStatus must be CONFIRMED or REJECTED" });
    }
    const app = await prisma.onboardingApplication.findUnique({ where: { id: req.params.id } });
    if (!app) return res.status(404).json({ error: "Not found" });
    await prisma.onboardingApplication.update({
      where: { id: req.params.id },
      data: { paymentStatus, adminNotes: notes !== undefined ? notes : app.adminNotes },
    });
    if (paymentStatus === "CONFIRMED" && !app.dealerId) {
      const tempPassword = randomPassword();
      const hashed = await bcrypt.hash(tempPassword, 10);
      const oneYear = new Date();
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      const slug = await generateWebsiteSlug(app.dealershipName || app.fullName);
      const dealer = await prisma.dealer.create({
        data: {
          name: app.fullName,
          email: app.email,
          password: hashed,
          phone: app.phone,
          dealershipName: app.dealershipName,
          city: app.city,
          website: app.website || null,
          websiteSlug: slug,
          websiteActive: true,
          websiteExpiresAt: oneYear,
        },
      });
      const monthlyAmount = app.selectedPlan === "ENTERPRISE" ? 20000 : app.selectedPlan === "PRO" ? 15000 : 0;
      await prisma.subscription.create({
        data: { dealerId: dealer.id, plan: app.selectedPlan, status: "ACTIVE", amount: monthlyAmount, notes: "Onboarding approval" },
      });
      await prisma.onboardingApplication.update({
        where: { id: req.params.id },
        data: { dealerId: dealer.id, status: "ACTIVE" },
      });
      const steps = ["profile", "first_car", "share_link", "complete"];
      for (const step of steps) {
        await prisma.onboardingStep.create({ data: { dealerId: dealer.id, step, completed: false } });
      }
      onboardingEmail.sendAccountApproved(dealer.email, dealer.name, tempPassword).catch((e) => console.error("Welcome email:", e));
      return res.json({ ok: true, dealerId: dealer.id, tempPassword });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("Admin payment update:", e);
    res.status(500).json({ error: "Failed to update" });
  }
});

router.post("/:id/approve", async (req, res) => {
  try {
    const app = await prisma.onboardingApplication.findUnique({ where: { id: req.params.id } });
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.dealerId) return res.status(400).json({ error: "Account already created for this application" });
    const tempPassword = randomPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);
    const oneYear = new Date();
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    const slug = await generateWebsiteSlug(app.dealershipName || app.fullName);
    const dealer = await prisma.dealer.create({
      data: {
        name: app.fullName,
        email: app.email,
        password: hashed,
        phone: app.phone,
        dealershipName: app.dealershipName,
        city: app.city,
        website: app.website || null,
        websiteSlug: slug,
        websiteActive: true,
        websiteExpiresAt: oneYear,
      },
    });
    const monthlyAmount = app.selectedPlan === "ENTERPRISE" ? 20000 : app.selectedPlan === "PRO" ? 15000 : 0;
    await prisma.subscription.create({
      data: {
        dealerId: dealer.id,
        plan: app.selectedPlan,
        status: "ACTIVE",
        amount: monthlyAmount,
        notes: "Onboarding approval",
      },
    });
    await prisma.onboardingApplication.update({
      where: { id: req.params.id },
      data: { dealerId: dealer.id, status: "ACTIVE", paymentStatus: "CONFIRMED" },
    });
    const steps = ["profile", "first_car", "share_link", "complete"];
    for (const step of steps) {
      await prisma.onboardingStep.create({
        data: { dealerId: dealer.id, step, completed: false },
      });
    }
    onboardingEmail.sendAccountApproved(dealer.email, dealer.name, tempPassword).catch((e) => console.error("Welcome email:", e));
    res.json({ dealerId: dealer.id, tempPassword });
  } catch (e) {
    console.error("Admin approve error:", e);
    res.status(500).json({ error: "Failed to approve" });
  }
});

router.post("/:id/reject", async (req, res) => {
  try {
    const reason = req.body.reason || "";
    const app = await prisma.onboardingApplication.findUnique({ where: { id: req.params.id } });
    if (!app) return res.status(404).json({ error: "Application not found" });
    await prisma.onboardingApplication.update({
      where: { id: req.params.id },
      data: { status: "REJECTED", rejectionReason: reason },
    });
    onboardingEmail.sendApplicationRejected(app.email, app.fullName, reason).catch(() => {});
    res.json({ ok: true });
  } catch (e) {
    console.error("Admin reject error:", e);
    res.status(500).json({ error: "Failed to reject" });
  }
});

router.patch("/:id/send-payment-instructions", async (req, res) => {
  try {
    const app = await prisma.onboardingApplication.findUnique({ where: { id: req.params.id } });
    if (!app) return res.status(404).json({ error: "Not found" });
    await prisma.onboardingApplication.update({
      where: { id: req.params.id },
      data: { status: "PAYMENT_PENDING" },
    });
    onboardingEmail.sendPaymentInstructions(app.email, app.fullName, app.paymentAmount, app.id).catch((e) => console.error("Payment instructions email:", e));
    res.json({ ok: true });
  } catch (e) {
    console.error("Send payment instructions:", e);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
