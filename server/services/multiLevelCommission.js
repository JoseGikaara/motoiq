import prisma from "../lib/prisma.js";

/**
 * When a lead is closed and has an affiliate (level 1), pay level 2 and 3 parents
 * based on dealer settings. Creates ReferralEvent for each level with value = dealValue * levelRate.
 */
export async function processMultiLevelCommission(leadId, dealerId, dealValue) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      car: { select: { price: true } },
      affiliate: { include: { parent: { include: { parent: true } } } },
    },
  });
  if (!lead?.affiliateId) return;

  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    select: {
      affiliateMultiLevelDepth: true,
      affiliateLevel2Rate: true,
      affiliateLevel3Rate: true,
    },
  });
  const depth = Math.min(3, Math.max(1, Number(dealer?.affiliateMultiLevelDepth) || 1));
  if (depth < 2) return;

  const baseValue = dealValue > 0 ? dealValue : (lead.car?.price ? Number(lead.car.price) : 0) || 0;
  if (baseValue <= 0) return;

  let current = lead.affiliate?.parent ?? null;
  let level = 2;
  const rates = [
    null,
    null,
    dealer?.affiliateLevel2Rate != null ? Number(dealer.affiliateLevel2Rate) : 0,
    dealer?.affiliateLevel3Rate != null ? Number(dealer.affiliateLevel3Rate) : 0,
  ];

  const { updateChallengeProgress } = await import("./affiliateGamification.js");
  while (current && level <= depth && rates[level] > 0) {
    const commission = Math.round(baseValue * rates[level]);
    if (commission > 0) {
      await prisma.referralEvent.create({
        data: {
          affiliateId: current.id,
          leadId: lead.id,
          eventType: "closed",
          value: commission,
          dealClosedAt: new Date(),
        },
      });
      await prisma.affiliate.update({
        where: { id: current.id },
        data: { lifetimeClosedDeals: { increment: 1 } },
      }).catch(() => {});
      await updateChallengeProgress(current.id, dealerId, "closed", baseValue).catch(() => {});
    }
    current = current.parent ?? null;
    level++;
  }
}
