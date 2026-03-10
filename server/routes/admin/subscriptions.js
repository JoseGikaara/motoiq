import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();

router.use(adminAuth);

router.get("/", async (req, res) => {
  try {
    const { plan, status } = req.query;
    const where = {};
    if (plan) where.plan = plan;
    if (status) where.status = status;
    const subs = await prisma.subscription.findMany({
      where,
      include: { dealer: { select: { id: true, name: true, email: true, dealershipName: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(subs);
  } catch (e) {
    console.error("Admin subscriptions error:", e);
    res.status(500).json({ error: "Failed to load subscriptions" });
  }
});

router.get("/expiring", async (req, res) => {
  try {
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);
    const subs = await prisma.subscription.findMany({
      where: { status: "ACTIVE", endDate: { lte: in7, gte: new Date() } },
      include: { dealer: { select: { id: true, name: true, dealershipName: true, email: true } } },
    });
    res.json(subs);
  } catch (e) {
    console.error("Admin expiring error:", e);
    res.status(500).json({ error: "Failed to load" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { dealerId, plan, status, endDate, amount, notes } = req.body;
    if (!dealerId) return res.status(400).json({ error: "dealerId required" });
    const data = {
      dealerId,
      plan: plan || "TRIAL",
      status: status || "ACTIVE",
      amount: amount != null ? parseInt(amount, 10) : 0,
      notes: notes || null,
    };
    if (endDate) data.endDate = new Date(endDate);
    const sub = await prisma.subscription.upsert({
      where: { dealerId },
      create: data,
      update: { plan: data.plan, status: data.status, amount: data.amount, notes: data.notes, endDate: data.endDate ?? undefined },
      include: { dealer: { select: { id: true, name: true, dealershipName: true } } },
    });
    res.json(sub);
  } catch (e) {
    console.error("Admin subscription create error:", e);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { plan, status, endDate, amount, notes } = req.body;
    const data = {};
    if (plan) data.plan = plan;
    if (status) data.status = status;
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (amount !== undefined) data.amount = parseInt(amount, 10);
    if (notes !== undefined) data.notes = notes;
    const sub = await prisma.subscription.update({
      where: { id: req.params.id },
      data,
      include: { dealer: { select: { id: true, name: true, dealershipName: true } } },
    });
    res.json(sub);
  } catch (e) {
    console.error("Admin subscription patch error:", e);
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

export default router;
