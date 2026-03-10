import prisma from "../lib/prisma.js";

/** Compute badges for an affiliate from their stats. */
export function computeBadges(affiliate) {
  const leads = affiliate.lifetimeLeads ?? 0;
  const testDrives = affiliate.lifetimeTestDrives ?? 0;
  const closed = affiliate.lifetimeClosedDeals ?? 0;
  const earned = Number(affiliate.totalEarned ?? 0);
  const badges = [];
  if (leads >= 1) badges.push({ id: "first_lead", name: "First Lead", description: "Generated your first lead", earned: true });
  if (leads >= 10) badges.push({ id: "ten_leads", name: "10 Leads", description: "Generated 10 leads", earned: true });
  if (leads >= 50) badges.push({ id: "fifty_leads", name: "50 Leads", description: "Generated 50 leads", earned: true });
  if (testDrives >= 1) badges.push({ id: "first_test_drive", name: "First Test Drive", description: "Booked your first test drive", earned: true });
  if (closed >= 1) badges.push({ id: "first_close", name: "First Sale", description: "Closed your first deal", earned: true });
  if (closed >= 5) badges.push({ id: "five_closes", name: "5 Sales", description: "Closed 5 deals", earned: true });
  if (earned >= 10000) badges.push({ id: "earner_10k", name: "KES 10K Earned", description: "Earned KES 10,000+", earned: true });
  if (affiliate.tier === "SILVER") badges.push({ id: "tier_silver", name: "Silver Tier", description: "Reached Silver tier", earned: true });
  if (affiliate.tier === "GOLD") badges.push({ id: "tier_gold", name: "Gold Tier", description: "Reached Gold tier", earned: true });
  if (affiliate.tier === "PLATINUM") badges.push({ id: "tier_platinum", name: "Platinum Tier", description: "Reached Platinum tier", earned: true });
  return badges;
}

/** Update challenge progress when a referral event occurs. eventType: 'lead' | 'test_drive' | 'closed'. value: for closed, deal value (for REVENUE challenge). */
export async function updateChallengeProgress(affiliateId, dealerId, eventType, value = 0) {
  const now = new Date();
  const active = await prisma.affiliateChallenge.findMany({
    where: { dealerId, isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    include: { progress: { where: { affiliateId } } },
  });
  for (const ch of active) {
    const applies =
      (eventType === "lead" && ch.targetType === "LEADS") ||
      (eventType === "test_drive" && ch.targetType === "TEST_DRIVES") ||
      (eventType === "closed" && ch.targetType === "CLOSED_DEALS") ||
      (eventType === "closed" && ch.targetType === "REVENUE");
    if (!applies) continue;
    const increment = ch.targetType === "REVENUE" ? Math.round(Number(value) || 0) : 1;
    if (ch.targetType === "REVENUE" && increment <= 0) continue;
    const progress = ch.progress[0];
    const currentValue = (progress?.currentValue ?? 0) + increment;
    await prisma.affiliateChallengeProgress.upsert({
      where: {
        affiliateId_challengeId: { affiliateId, challengeId: ch.id },
      },
      update: {
        currentValue,
        completedAt: currentValue >= ch.targetValue ? new Date() : undefined,
      },
      create: {
        affiliateId,
        challengeId: ch.id,
        currentValue,
        completedAt: currentValue >= ch.targetValue ? new Date() : null,
      },
    });
  }
}
