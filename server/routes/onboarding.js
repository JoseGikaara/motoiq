import { Router } from "express";
import rateLimit from "express-rate-limit";
import prisma from "../lib/prisma.js";
import * as onboardingEmail from "../utils/sendOnboardingEmail.js";
import { verifyCaptchaToken } from "../utils/verifyCaptcha.js";

const SETUP_FEE = 70000;
export const onboardingRouter = Router();

const applyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

onboardingRouter.post("/apply", applyLimiter, async (req, res) => {
  try {
    const b = req.body;
    if (!b.fullName || !b.email || !b.phone || !b.dealershipName || !b.city || !b.stockSize || !b.monthlyLeads || !b.currentProcess) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const captchaOk = await verifyCaptchaToken(b.captchaToken, req.ip);
    if (!captchaOk) {
      return res.status(400).json({ error: "Captcha verification failed" });
    }
    const existing = await prisma.onboardingApplication.findUnique({ where: { email: b.email } });
    if (existing && !["REJECTED"].includes(existing.status)) {
      return res.status(400).json({ error: "An application with this email already exists" });
    }
    const plan = b.selectedPlan === "ENTERPRISE" ? "ENTERPRISE" : b.selectedPlan === "PRO" || b.selectedPlan === "PROFESSIONAL" ? "PRO" : "BASIC";
    const app = await prisma.onboardingApplication.create({
      data: {
        fullName: b.fullName,
        email: b.email,
        phone: b.phone,
        dealershipName: b.dealershipName,
        city: b.city,
        stockSize: b.stockSize,
        monthlyLeads: b.monthlyLeads,
        currentProcess: b.currentProcess,
        socialMedia: b.socialMedia || null,
        website: b.website || null,
        selectedPlan: plan,
        paymentMethod: "MPESA",
        paymentStatus: "PENDING",
        paymentAmount: SETUP_FEE,
        status: "SUBMITTED",
      },
    });
    onboardingEmail.sendApplicationReceived(app.email, app.fullName).catch((e) => console.error("Email:", e));
    const admin = await prisma.admin.findFirst();
    if (admin) onboardingEmail.sendAdminNewApplication(admin.email, app.fullName, app.dealershipName).catch(() => {});
    res.status(201).json({ applicationId: app.id, email: app.email });
  } catch (e) {
    console.error("Apply error:", e);
    res.status(500).json({ error: "Failed to submit application" });
  }
});

onboardingRouter.get("/status/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const app = await prisma.onboardingApplication.findUnique({ where: { email } });
    if (!app) return res.status(404).json({ error: "Application not found" });
    const paymentInstructions = app.status === "PAYMENT_PENDING" ? { amount: app.paymentAmount, paybill: "522522", accountSuffix: app.id.slice(-6), applicationId: app.id } : undefined;
    res.json({ status: app.status, paymentStatus: app.paymentStatus, paymentInstructions, applicationId: app.id });
  } catch (e) {
    console.error("Status error:", e);
    res.status(500).json({ error: "Failed to get status" });
  }
});

onboardingRouter.post("/payment-proof", async (req, res) => {
  try {
    const { applicationId, paymentRef, paymentMethod, paymentProofUrl } = req.body;
    if (!applicationId || !paymentRef) return res.status(400).json({ error: "applicationId and paymentRef required" });
    const app = await prisma.onboardingApplication.findUnique({ where: { id: applicationId } });
    if (!app) return res.status(404).json({ error: "Application not found" });
    const method = paymentMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : paymentMethod === "EQUITY" ? "EQUITY" : "MPESA";
    await prisma.onboardingApplication.update({
      where: { id: applicationId },
      data: { paymentRef, paymentMethod: method, paymentProof: paymentProofUrl || null, paymentStatus: "SUBMITTED", status: "PAYMENT_SUBMITTED", paymentDate: new Date() },
    });
    onboardingEmail.sendPaymentReceived(app.email, app.fullName).catch(() => {});
    const admin = await prisma.admin.findFirst();
    if (admin) onboardingEmail.sendAdminPaymentSubmitted(admin.email, app.fullName, paymentRef).catch(() => {});
    res.json({ ok: true, message: "Payment confirmation submitted" });
  } catch (e) {
    console.error("Payment proof error:", e);
    res.status(500).json({ error: "Failed to submit payment proof" });
  }
});
