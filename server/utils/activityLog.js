import prisma from "../lib/prisma.js";

/**
 * Log platform activity for admin visibility.
 * @param {Object} opts - { dealerId?: string, action: string, detail?: string, ip?: string }
 */
export async function logActivity(opts) {
  const { dealerId = null, action, detail = null, ip = null, creditsUsed = null, creditsAfter = null } = opts;
  try {
    await prisma.activityLog.create({
      data: { dealerId, action, detail, ip, creditsUsed, creditsAfter },
    });
  } catch (e) {
    console.error("Activity log failed:", e?.message);
  }
}

export function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || null;
}
