import cron from "node-cron";
import prisma from "../lib/prisma.js";
import { runDripNurture } from "../services/dripRunner.js";
import { notifyWebsiteExpiry } from "../utils/notify.js";
import * as Sentry from "@sentry/node";

export function startTasksCron() {
  // Lead response timer: every 5 min — create HIGH priority task if lead still NEW after 30 min
  cron.schedule("*/5 * * * *", async () => {
    const thirtyMinAgo = new Date();
    thirtyMinAgo.setMinutes(thirtyMinAgo.getMinutes() - 30);
    try {
      const newLeads = await prisma.lead.findMany({
        where: {
          status: "NEW",
          createdAt: { lt: thirtyMinAgo },
          tasks: { none: {} },
        },
        include: { dealer: true, car: true },
      });
      for (const lead of newLeads) {
        await prisma.task.create({
          data: {
            dealerId: lead.dealerId,
            leadId: lead.id,
            message: "Respond to new WhatsApp lead",
            priority: "HIGH",
            done: false,
          },
        }).catch(() => {});
      }
    } catch (e) {
      console.error("Lead response timer cron error:", e);
    }
  });

  // Stale lead tasks: daily 8am Nairobi
  cron.schedule("0 8 * * *", async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    try {
      const staleLeads = await prisma.lead.findMany({
        where: {
          status: { in: ["NEW", "CONTACTED"] },
          updatedAt: { lt: twoDaysAgo },
        },
        include: { car: true, dealer: true },
      });
      for (const lead of staleLeads) {
        const message = `Follow up: ${lead.name} — ${lead.car?.make} ${lead.car?.model}. Not contacted in 2+ days.`;
        await prisma.task.upsert({
          where: {
            leadId_dealerId: { leadId: lead.id, dealerId: lead.dealer.id },
          },
          create: {
            dealerId: lead.dealer.id,
            leadId: lead.id,
            message,
            done: false,
          },
          update: { message },
        }).catch(() => {});
      }
    } catch (e) {
      console.error("Tasks cron error:", e);
    }
  }, { timezone: "Africa/Nairobi" });

  // Drip nurture: every 6 hours
  cron.schedule(
    "0 */6 * * *",
    async () => {
      try {
        await runDripNurture();
      } catch (e) {
        console.error("Drip nurture cron error:", e);
        if (process.env.SENTRY_DSN) {
          Sentry.captureException(e);
        }
      }
    },
    { timezone: "Africa/Nairobi" }
  );

  // Website hosting expiry reminders: daily 9am Nairobi, ~30 days before expiry
  cron.schedule("0 9 * * *", async () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() + 29);
    const end = new Date(now);
    end.setDate(end.getDate() + 31);
    try {
      const dealers = await prisma.dealer.findMany({
        where: {
          websiteActive: true,
          websiteExpiresAt: { gte: start, lt: end },
        },
        select: {
          id: true,
          dealershipName: true,
          email: true,
          phone: true,
          websiteSlug: true,
          websiteExpiresAt: true,
        },
      });
      for (const dealer of dealers) {
        await notifyWebsiteExpiry(dealer).catch(() => {});
      }
    } catch (e) {
      console.error("Website expiry cron error:", e);
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(e);
      }
    }
  }, { timezone: "Africa/Nairobi" });

  // Simple uptime check: ping own /api/health every 5 minutes and send to Sentry if down
  cron.schedule("*/5 * * * *", async () => {
    try {
      const res = await fetch(`${process.env.UPTIME_HEALTH_URL || "http://localhost:3001/api/health"}`);
      if (!res.ok) {
        const err = new Error(`Healthcheck failed with status ${res.status}`);
        if (process.env.SENTRY_DSN) {
          Sentry.captureException(err);
        }
      }
    } catch (e) {
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(e);
      }
    }
  });
}
