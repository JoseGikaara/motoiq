import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { logActivity, getClientIp } from "../utils/activityLog.js";

export const testDrivesRouter = Router();

// Public: book test drive from landing page
testDrivesRouter.post("/", async (req, res) => {
  try {
    const { carId, dealerId, name, phone, date, timeSlot, notes, refCode } = req.body;
    if (!carId || !dealerId || !name || !phone || !date || !timeSlot) {
      return res.status(400).json({ error: "carId, dealerId, name, phone, date and timeSlot required" });
    }
    const car = await prisma.car.findUnique({ where: { id: carId }, include: { dealer: true } });
    if (!car || car.dealerId !== dealerId) return res.status(404).json({ error: "Car not found" });

    const referralCode = req.query.ref || refCode || null;
    let affiliate = null;
    if (referralCode) {
      affiliate = await prisma.affiliate.findFirst({
        where: {
          referralCode: String(referralCode),
          dealerId,
          status: "active",
        },
      });
    }
    let lead = await prisma.lead.findFirst({
      where: { carId, dealerId, phone },
      orderBy: { createdAt: "desc" },
    });
    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          carId,
          dealerId,
          name,
          phone,
          email: (name || "guest").replace(/\s/g, "") + "@testdrive.motoriq",
          affiliateId: affiliate?.id || null,
          status: "NEW",
        },
      });
    }
    const testDrive = await prisma.testDrive.create({
      data: {
        carId,
        dealerId,
        leadId: lead.id,
        date: new Date(date),
        timeSlot,
        notes: notes || null,
        status: "PENDING",
      },
    });
    const withRelations = await prisma.testDrive.findUnique({
      where: { id: testDrive.id },
      include: { car: true, lead: true },
    });
    logActivity({
      dealerId: car.dealerId,
      action: "TEST_DRIVE_BOOKED",
      detail: `${withRelations.car?.make} ${withRelations.car?.model} – ${withRelations.lead?.name}`,
      ip: getClientIp(req),
    }).catch(() => {});

    if (affiliate) {
      const dealerSettings = await prisma.dealer.findUnique({
        where: { id: car.dealerId },
        select: { affiliateCommissionMode: true, affiliateCommissionPerTestDrive: true },
      });
      const fixedTdKes =
        dealerSettings?.affiliateCommissionMode === "fixed" && dealerSettings?.affiliateCommissionPerTestDrive != null
          ? Number(dealerSettings.affiliateCommissionPerTestDrive)
          : null;
      await prisma.referralEvent.create({
        data: {
          affiliateId: affiliate.id,
          leadId: lead.id,
          testDriveId: testDrive.id,
          eventType: "test_drive",
          value: fixedTdKes != null ? fixedTdKes : undefined,
        },
      });
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: { lifetimeTestDrives: { increment: 1 } },
      }).catch(() => {});
      const { updateChallengeProgress } = await import("../services/affiliateGamification.js");
      updateChallengeProgress(affiliate.id, car.dealerId, "test_drive").catch(() => {});
    }
    res.status(201).json(withRelations);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to book test drive" });
  }
});

testDrivesRouter.use(requireAuth);

testDrivesRouter.get("/", async (req, res) => {
  try {
    const list = await prisma.testDrive.findMany({
      where: { dealerId: req.dealer.id },
      include: { car: true, lead: true },
      orderBy: { date: "asc" },
    });
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch test drives" });
  }
});

testDrivesRouter.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const td = await prisma.testDrive.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
    });
    if (!td) return res.status(404).json({ error: "Test drive not found" });
    const updated = await prisma.testDrive.update({
      where: { id: td.id },
      data: { status },
      include: { car: true, lead: true },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update test drive" });
  }
});
