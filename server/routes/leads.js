import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { notifyDealer } from "../utils/notify.js";
import { logActivity, getClientIp } from "../utils/activityLog.js";
import { verifyCaptchaToken } from "../utils/verifyCaptcha.js";

export const leadsRouter = Router();

const publicLeadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

leadsRouter.post("/interested-dealer", publicLeadLimiter, async (req, res) => {
  try {
    const { name, dealershipName, email, phone, city, inventorySize } = req.body;
    if (!name || !dealershipName || !email || !phone || !city) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const numericInventorySize =
      inventorySize === undefined || inventorySize === null || inventorySize === ""
        ? null
        : Number.parseInt(inventorySize, 10);

    await prisma.interestedDealer.create({
      data: {
        name,
        dealershipName,
        email,
        phone,
        city,
        inventorySize: Number.isNaN(numericInventorySize) ? null : numericInventorySize,
      },
    });

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error("Interested dealer lead error:", e);
    res.status(500).json({ error: "Failed to submit interest" });
  }
});

async function resolveBuyerReferral(carId, refCode) {
  if (!refCode || !carId) return null;
  const existing = await prisma.buyerReferral.findFirst({
    where: { refCode: String(refCode).trim(), carId },
  });
  if (existing) return existing.id;
  const created = await prisma.buyerReferral.create({
    data: { refCode: String(refCode).trim(), carId, leadsGenerated: 0 },
  });
  return created.id;
}

// Public: WhatsApp lead — capture lead then redirect to WhatsApp
leadsRouter.post("/whatsapp", publicLeadLimiter, async (req, res) => {
  try {
    const { carId, dealerId, message, affiliateId: bodyAffiliateId, buyerRef } = req.body;
    const refCode = req.body.refCode || req.query.ref || null;

    if (!carId) return res.status(400).json({ error: "carId required" });

    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: { dealer: true },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    const resolvedDealerId = dealerId || car.dealerId;

    let affiliate = null;
    if (bodyAffiliateId) {
      affiliate = await prisma.affiliate.findFirst({
        where: { id: bodyAffiliateId, dealerId: resolvedDealerId, status: "active" },
      });
    }
    if (!affiliate && refCode) {
      affiliate = await prisma.affiliate.findFirst({
        where: {
          referralCode: String(refCode),
          dealerId: resolvedDealerId,
          status: "active",
        },
      });
    }

    const buyerReferralId = await resolveBuyerReferral(carId, buyerRef || req.query.buyerRef);

    const lead = await prisma.lead.create({
      data: {
        carId,
        dealerId: resolvedDealerId,
        affiliateId: affiliate?.id || null,
        buyerReferralId: buyerReferralId || undefined,
        name: "WhatsApp inquiry",
        phone: "-",
        email: "whatsapp@motoriq.ke",
        source: "whatsapp",
        notes: message || null,
        status: "NEW",
      },
      include: { car: { select: { make: true, model: true, year: true } } },
    });

    if (buyerReferralId) {
      await prisma.buyerReferral.update({
        where: { id: buyerReferralId },
        data: { leadsGenerated: { increment: 1 } },
      }).catch(() => {});
    }

    if (affiliate) {
      const dealerSettings = await prisma.dealer.findUnique({
        where: { id: resolvedDealerId },
        select: { affiliateCommissionMode: true, affiliateCommissionPerLead: true },
      });
      const fixedLeadKes =
        dealerSettings?.affiliateCommissionMode === "fixed" && dealerSettings?.affiliateCommissionPerLead != null
          ? Number(dealerSettings.affiliateCommissionPerLead)
          : null;
      await prisma.referralEvent.create({
        data: {
          affiliateId: affiliate.id,
          leadId: lead.id,
          eventType: "lead",
          value: fixedLeadKes != null ? fixedLeadKes : undefined,
        },
      });
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: { lifetimeLeads: { increment: 1 } },
      }).catch(() => {});
      const { updateChallengeProgress } = await import("../services/affiliateGamification.js");
      updateChallengeProgress(affiliate.id, resolvedDealerId, "lead").catch(() => {});
    }

    notifyDealer(car.dealer, lead, car).catch((err) => console.error("Notify dealer failed:", err));
    logActivity({
      dealerId: resolvedDealerId,
      action: "LEAD_CAPTURED",
      detail: `WhatsApp – ${lead.car?.make} ${lead.car?.model} ${lead.car?.year}`,
      ip: getClientIp(req),
    }).catch(() => {});

    // Schedule follow-up task if lead not contacted in 30 min (handled by cron)
    res.status(201).json({ success: true, leadId: lead.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create WhatsApp lead" });
  }
});

// Public: widget lead (call / generic) — minimal lead record for dealer site CTAs
leadsRouter.post("/widget", publicLeadLimiter, async (req, res) => {
  try {
    const { carId, dealerId, source } = req.body;
    if (!carId) return res.status(400).json({ error: "carId required" });
    const resolvedSource = source === "call" ? "call" : source === "test_drive" ? "test_drive" : "widget";

    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: { dealer: true },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    const resolvedDealerId = dealerId || car.dealerId;

    const lead = await prisma.lead.create({
      data: {
        carId,
        dealerId: resolvedDealerId,
        name: resolvedSource === "call" ? "Call inquiry" : "Website inquiry",
        phone: "-",
        email: "widget@motoriq.ke",
        source: resolvedSource,
        status: "NEW",
      },
      include: { car: { select: { make: true, model: true, year: true } } },
    });

    notifyDealer(car.dealer, lead, car).catch((err) => console.error("Notify dealer failed:", err));
    logActivity({
      dealerId: resolvedDealerId,
      action: "LEAD_CAPTURED",
      detail: `${resolvedSource} – ${lead.car?.make} ${lead.car?.model} ${lead.car?.year}`,
      ip: getClientIp(req),
    }).catch(() => {});

    res.status(201).json({ success: true, leadId: lead.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create lead" });
  }
});

// Public: submit lead from landing page (no auth)
leadsRouter.post("/", publicLeadLimiter, async (req, res) => {
  try {
    const { carId, name, phone, email, budget, financing, timeframe, tradeIn, source, captchaToken, refCode, buyerRef } = req.body;

    const captchaOk = await verifyCaptchaToken(captchaToken, req.ip);
    if (!captchaOk) {
      return res.status(400).json({ error: "Captcha verification failed" });
    }

    if (!carId || !name || !phone || !email) {
      return res.status(400).json({ error: "carId, name, phone and email required" });
    }
    const car = await prisma.car.findUnique({ where: { id: carId }, include: { dealer: true } });
    if (!car) return res.status(404).json({ error: "Car not found" });

    const referralCode = req.query.ref || refCode || null;
    let affiliate = null;
    if (referralCode) {
      affiliate = await prisma.affiliate.findFirst({
        where: {
          referralCode: String(referralCode),
          dealerId: car.dealerId,
          status: "active",
        },
      });
    }

    const buyerReferralId = await resolveBuyerReferral(carId, buyerRef || req.query.buyerRef);

    const lead = await prisma.lead.create({
      data: {
        carId,
        dealerId: car.dealerId,
        affiliateId: affiliate?.id || null,
        buyerReferralId: buyerReferralId || undefined,
        name,
        phone,
        email,
        budget: budget || null,
        financing: financing || null,
        timeframe: timeframe || null,
        tradeIn: tradeIn || null,
        source: source || null,
        status: "NEW",
      },
      include: { car: { select: { make: true, model: true, year: true } } },
    });

    if (buyerReferralId) {
      await prisma.buyerReferral.update({
        where: { id: buyerReferralId },
        data: { leadsGenerated: { increment: 1 } },
      }).catch(() => {});
    }

    if (affiliate) {
      const dealerSettings = await prisma.dealer.findUnique({
        where: { id: car.dealerId },
        select: { affiliateCommissionMode: true, affiliateCommissionPerLead: true },
      });
      const fixedLeadKes =
        dealerSettings?.affiliateCommissionMode === "fixed" && dealerSettings?.affiliateCommissionPerLead != null
          ? Number(dealerSettings.affiliateCommissionPerLead)
          : null;
      await prisma.referralEvent.create({
        data: {
          affiliateId: affiliate.id,
          leadId: lead.id,
          eventType: "lead",
          value: fixedLeadKes != null ? fixedLeadKes : undefined,
        },
      });
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: { lifetimeLeads: { increment: 1 } },
      }).catch(() => {});
      const { updateChallengeProgress } = await import("../services/affiliateGamification.js");
      updateChallengeProgress(affiliate.id, car.dealerId, "lead").catch(() => {});
    }
    notifyDealer(car.dealer, lead, car).catch((err) => console.error("Notify dealer failed:", err));
    logActivity({
      dealerId: car.dealerId,
      action: "LEAD_CAPTURED",
      detail: `${lead.name} – ${lead.car?.make} ${lead.car?.model} ${lead.car?.year}`,
      ip: getClientIp(req),
    }).catch(() => {});
    res.status(201).json(lead);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to submit lead" });
  }
});

// All below require auth
leadsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { dealerId: req.dealer.id },
      include: { car: { select: { id: true, make: true, model: true, year: true, price: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(leads);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

leadsRouter.get("/analytics", requireAuth, async (req, res) => {
  try {
    const dealerId = req.dealer.id;
    const affiliateOnly = req.query.affiliateOnly === "true" || req.query.affiliateOnly === "1";
    const leads = await prisma.lead.findMany({
      where: {
        dealerId,
        ...(affiliateOnly ? { affiliateId: { not: null } } : {}),
      },
      include: { car: true },
    });
    const byStatus = {};
    leads.forEach((l) => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    });
    const total = leads.length;
    const contacted = leads.filter((l) => l.status !== "NEW").length;
    const booked = leads.filter((l) => l.status === "TEST_DRIVE" || l.status === "NEGOTIATION").length;
    const closed = leads.filter((l) => l.status === "CLOSED").length;
    const notContacted = leads.filter((l) => l.status === "NEW").length;
    const avgPrice = leads.length ? leads.reduce((s, l) => s + (l.car?.price || 0), 0) / leads.length : 0;
    const estimatedLost = Math.round(notContacted * avgPrice * 0.1);

    const byDay = {};
    leads.forEach((l) => {
      const d = new Date(l.createdAt).toISOString().slice(0, 10);
      byDay[d] = (byDay[d] || 0) + 1;
    });
    const leadsOverTime = Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const carLeadCount = {};
    leads.forEach((l) => {
      const key = l.carId;
      if (!carLeadCount[key]) carLeadCount[key] = { car: l.car, count: 0 };
      carLeadCount[key].count++;
    });
    const topCars = Object.values(carLeadCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const bySource = {};
    leads.forEach((l) => {
      const s = l.affiliateId ? "affiliate" : (l.source || "direct");
      bySource[s] = (bySource[s] || 0) + 1;
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recoveredLeads = leads.filter(
      (l) => ["CONTACTED", "TEST_DRIVE", "NEGOTIATION", "CLOSED"].includes(l.status) && new Date(l.updatedAt) >= sevenDaysAgo
    );
    const recoveredCount = recoveredLeads.length;
    const revenueRecovered = Math.round(recoveredCount * avgPrice * 0.1);

    const taskCount = await prisma.task.count({
      where: { dealerId, done: false },
    });

    const whatsappLeads = leads.filter((l) => l.source === "whatsapp");
    const whatsappByCar = {};
    whatsappLeads.forEach((l) => {
      const key = l.carId;
      if (!whatsappByCar[key]) whatsappByCar[key] = { car: l.car, count: 0 };
      whatsappByCar[key].count++;
    });
    const whatsappLeadsByCar = Object.values(whatsappByCar)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((o) => ({ carId: o.car?.id, carLabel: o.car ? `${o.car.year} ${o.car.make} ${o.car.model}` : "Unknown", count: o.count }));

    let shareClicksCount = 0;
    try {
      if (prisma.carShareClick && typeof prisma.carShareClick.count === "function") {
        shareClicksCount = await prisma.carShareClick.count({
          where: { car: { dealerId } },
        });
      }
    } catch {
      shareClicksCount = 0;
    }
    const testDriveCount = leads.filter((l) => ["TEST_DRIVE", "NEGOTIATION"].includes(l.status)).length;
    const conversionFunnel = [
      { stage: "Link clicks", count: shareClicksCount, fill: "#64748b" },
      { stage: "Leads", count: total, fill: "#2563EB" },
      { stage: "Test drive", count: testDriveCount, fill: "#22c55e" },
      { stage: "Sale", count: closed, fill: "#F97316" },
    ];

    res.json({
      total,
      byStatus,
      bySource,
      contacted,
      booked,
      closed,
      notContacted,
      estimatedLost,
      avgPrice,
      leadsOverTime,
      topCars,
      revenueRecovered,
      recoveredCount,
      taskCount,
      referredLeads: leads.filter((l) => l.affiliateId != null).length,
      whatsappLeadsByCar,
      conversionFunnel,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

leadsRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
      include: {
        car: true,
        followUps: { orderBy: { day: "asc" } },
        communications: { orderBy: { createdAt: "desc" }, take: 50 },
        dripEnrollments: { include: { sequence: { select: { id: true, name: true } } } },
      },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

leadsRouter.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["NEW", "CONTACTED", "TEST_DRIVE", "NEGOTIATION", "CLOSED", "LOST"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
      include: { car: true, affiliate: true },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const wasClosed = lead.status === "CLOSED";

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: { status },
      include: { car: { select: { make: true, model: true, year: true } } },
    });

    if (!wasClosed && status === "CLOSED" && lead.affiliateId) {
      const dealer = await prisma.dealer.findUnique({
        where: { id: req.dealer.id },
        select: {
          affiliateCommissionMode: true,
          affiliateCommissionPerClose: true,
        },
      });
      const affiliate = lead.affiliate;
      let commission = 0;
      if (dealer?.affiliateCommissionMode === "fixed" && dealer?.affiliateCommissionPerClose != null) {
        commission = Math.max(0, Number(dealer.affiliateCommissionPerClose));
      } else {
        const baseValue =
          (lead.dealValue != null ? Number(lead.dealValue) : lead.car?.price != null ? Number(lead.car.price) : 0) || 0;
        if (baseValue > 0) {
          const rate = affiliate?.payoutRate != null ? Number(affiliate.payoutRate) : 0;
          commission = Math.max(0, Math.round(baseValue * rate));
        }
      }
      if (commission > 0) {
        await prisma.referralEvent.create({
          data: {
            affiliateId: lead.affiliateId,
            leadId: lead.id,
            eventType: "closed",
            value: commission,
            dealClosedAt: new Date(),
          },
        });
      }
      const dealVal = lead.dealValue != null ? Number(lead.dealValue) : lead.car?.price != null ? Number(lead.car.price) : 0;
      await prisma.affiliate.update({
        where: { id: lead.affiliateId },
        data: { lifetimeClosedDeals: { increment: 1 } },
      }).catch(() => {});
      const { updateChallengeProgress } = await import("../services/affiliateGamification.js");
      updateChallengeProgress(lead.affiliateId, req.dealer.id, "closed", dealVal).catch(() => {});
      const { processMultiLevelCommission } = await import("../services/multiLevelCommission.js");
      await processMultiLevelCommission(lead.id, req.dealer.id, dealVal).catch((err) => console.error("Multi-level commission error:", err));
    }

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update status" });
  }
});

/** POST /api/leads/:id/enroll-drip — manually enroll lead in a sequence */
leadsRouter.post("/:id/enroll-drip", requireAuth, async (req, res) => {
  try {
    const { sequenceId } = req.body;
    if (!sequenceId) return res.status(400).json({ error: "sequenceId required" });

    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const sequence = await prisma.dripSequence.findFirst({
      where: { id: sequenceId, dealerId: req.dealer.id, isActive: true },
    });
    if (!sequence) return res.status(400).json({ error: "Sequence not found or inactive" });

    const existing = await prisma.leadDripEnrollment.findFirst({
      where: { leadId: lead.id, sequenceId, status: "ACTIVE" },
    });
    if (existing) return res.status(400).json({ error: "Lead already enrolled in this sequence" });

    const enrollment = await prisma.leadDripEnrollment.create({
      data: { leadId: lead.id, sequenceId, currentStep: 1, status: "ACTIVE" },
      include: { sequence: { include: { steps: { orderBy: { order: "asc" } } } } },
    });
    res.status(201).json(enrollment);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to enroll lead" });
  }
});

/** PATCH /api/leads/:id/drip-enrollment/:enrollmentId — pause or stop */
leadsRouter.patch("/:id/drip-enrollment/:enrollmentId", requireAuth, async (req, res) => {
  try {
    const { status } = req.body; // PAUSED | STOPPED
    if (!["PAUSED", "STOPPED"].includes(status))
      return res.status(400).json({ error: "status must be PAUSED or STOPPED" });

    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const enrollment = await prisma.leadDripEnrollment.findFirst({
      where: {
        id: req.params.enrollmentId,
        leadId: lead.id,
        sequence: { dealerId: req.dealer.id },
      },
    });
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    const updated = await prisma.leadDripEnrollment.update({
      where: { id: enrollment.id },
      data: { status },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update enrollment" });
  }
});

/** POST /api/leads/:id/send-sms — send SMS to lead (agentic / next-best-action). Logs to CommunicationLog. */
leadsRouter.post("/:id/send-sms", requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message required" });
    }
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
      include: { car: true },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    function normalizePhone(phone) {
      if (!phone) return null;
      const d = String(phone).replace(/\D/g, "");
      if (d.startsWith("0")) return "254" + d.slice(1);
      if (d.startsWith("254")) return d;
      return "254" + d;
    }
    const to = normalizePhone(lead.phone);
    let sendStatus = "LOGGED";
    if (to) {
      const apiKey = process.env.AFRICASTALKING_API_KEY || process.env.AFRICASTALKING_KEY;
      const username = process.env.AFRICASTALKING_USERNAME;
      if (apiKey) {
        try {
          const AfricasTalking = (await import("africastalking")).default;
          const at = AfricasTalking({ apiKey, username: username || "sandbox" });
          await at.SMS.send({ to: [to], message: message.trim() });
          sendStatus = "SENT";
        } catch (err) {
          console.error("Send SMS error:", err);
          sendStatus = "FAILED";
        }
      }
    }

    await prisma.communicationLog.create({
      data: {
        leadId: lead.id,
        dealerId: req.dealer.id,
        channel: "SMS",
        direction: "OUTBOUND",
        content: message.trim(),
        snippet: message.trim().slice(0, 160),
        status: sendStatus,
        meta: JSON.stringify({ source: "agentic" }),
      },
    });
    await prisma.lead.update({
      where: { id: lead.id },
      data: { updatedAt: new Date() },
    });
    const updated = await prisma.lead.findFirst({
      where: { id: lead.id },
      include: {
        car: true,
        communications: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    res.json({ ok: true, status: sendStatus, lead: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

/** POST /api/leads/:id/log-communication — manual log call/SMS/note (updates comm log + last contact) */
leadsRouter.post("/:id/log-communication", requireAuth, async (req, res) => {
  try {
    const { channel, content } = req.body;
    const validChannels = ["CALL", "SMS", "NOTE"];
    if (!channel || !validChannels.includes(channel)) {
      return res.status(400).json({ error: "channel must be one of CALL, SMS, NOTE" });
    }
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "content required" });
    }
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    await prisma.communicationLog.create({
      data: {
        leadId: lead.id,
        dealerId: req.dealer.id,
        channel,
        direction: "OUTBOUND",
        content: content.trim(),
        snippet: content.trim().slice(0, 160),
        status: "LOGGED",
      },
    });
    await prisma.lead.update({
      where: { id: lead.id },
      data: { updatedAt: new Date() },
    });
    const updated = await prisma.lead.findFirst({
      where: { id: lead.id },
      include: {
        communications: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    res.status(201).json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to log communication" });
  }
});

leadsRouter.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { status, notes, score, scoreReason, urgency, dealValue } = req.body;
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    const data = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (score !== undefined) data.score = score;
    if (scoreReason !== undefined) data.scoreReason = scoreReason;
    if (urgency !== undefined) data.urgency = urgency;
    if (dealValue !== undefined) data.dealValue = dealValue == null ? null : Number(dealValue);
    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data,
      include: { car: true, followUps: true },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update lead" });
  }
});
