import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();
const startTime = Date.now();

router.use(adminAuth);

router.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const mem = process.memoryUsage();
    const uptimeMs = Date.now() - startTime;
    const uptimeHours = Math.floor(uptimeMs / 3600000);
    const uptimeMins = Math.floor((uptimeMs % 3600000) / 60000);

    res.json({
      database: "Connected",
      openai: !!(process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY),
      smtp: !!(process.env.SMTP_HOST || process.env.MAIL_FROM),
      africastalking: !!(process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME),
      uptime: `${uptimeHours}h ${uptimeMins}m`,
      memory: {
        usedMB: Math.round(mem.heapUsed / 1024 / 1024),
        totalMB: Math.round(mem.heapTotal / 1024 / 1024),
      },
    });
  } catch (e) {
    res.status(500).json({
      database: e?.message || "Error",
      openai: !!(process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY),
      smtp: !!(process.env.SMTP_HOST || process.env.MAIL_FROM),
      africastalking: !!(process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME),
      uptime: "—",
      memory: {},
    });
  }
});

router.get("/usage", async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [aiCalls, leadsCount, carCount] = await Promise.all([
      prisma.activityLog.count({ where: { action: { contains: "AI", mode: "insensitive" }, createdAt: { gte: startOfMonth } } }),
      prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.car.count(),
    ]);

    const cars = await prisma.car.findMany({ select: { photos: true } });
    const photoCount = cars.reduce((s, c) => s + (c.photos?.length || 0), 0);
    const estimatedCost = (aiCalls * 0.001).toFixed(2);

    res.json({
      aiCallsThisMonth: aiCalls,
      leadsThisMonth: leadsCount,
      estimatedAiCostUsd: estimatedCost,
      totalCars: carCount,
      photoCount,
    });
  } catch (e) {
    console.error("Admin usage error:", e);
    res.status(500).json({ error: "Failed to load usage" });
  }
});

const ENV_KEYS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "OPENAI_API_KEY",
  "DEEPSEEK_API_KEY",
  "SMTP_HOST",
  "MAIL_FROM",
  "AFRICASTALKING_API_KEY",
  "AFRICASTALKING_USERNAME",
];

router.get("/env", (req, res) => {
  const list = ENV_KEYS.map((key) => ({
    key,
    set: !!(process.env[key] && String(process.env[key]).trim()),
  }));
  res.json(list);
});

router.post("/test-email", async (req, res) => {
  try {
    const nodemailer = await import("nodemailer");
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      return res.status(400).json({ error: "SMTP not configured" });
    }
    const transporter = nodemailer.default.createTransport({
      host,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_PORT === "465",
      auth: { user, pass },
    });
    const from = process.env.SMTP_FROM || process.env.MAIL_FROM || user;
    const to = req.admin?.email || user;
    await transporter.sendMail({
      from,
      to,
      subject: "MotorIQ Admin – Test Email",
      text: "This is a test email from MotorIQ Admin Console.",
    });
    res.json({ ok: true, message: "Test email sent to " + to });
  } catch (e) {
    console.error("Test email error:", e);
    res.status(500).json({ error: e?.message || "Failed to send test email" });
  }
});

export default router;
