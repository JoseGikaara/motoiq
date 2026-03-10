import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

export const bannersRouter = Router();
bannersRouter.use(requireAuth);

const MAX_ACTIVE_ROTATING = 5;

/** GET /api/banners — list all banners for the dealer */
bannersRouter.get("/", async (req, res) => {
  try {
    const banners = await prisma.dealerBanner.findMany({
      where: { dealerId: req.dealer.id },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });
    res.json(banners);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
});

/** POST /api/banners — create banner */
bannersRouter.post("/", async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      imageUrl,
      ctaText,
      ctaTarget,
      ctaUrl,
      startDate,
      endDate,
      isActive,
      displayOrder,
      backgroundColor,
      textColor,
    } = req.body || {};
    if (!type || !title) return res.status(400).json({ error: "type and title required" });
    if (!["ROTATING", "FLASH_SALE", "HEADLINE"].includes(type)) return res.status(400).json({ error: "Invalid type" });
    const target = ctaTarget || "NONE";
    if (!["NONE", "INVENTORY", "FINANCING", "CONTACT", "CUSTOM_URL"].includes(target)) return res.status(400).json({ error: "Invalid ctaTarget" });
    if (target === "CUSTOM_URL" && !ctaUrl?.trim()) return res.status(400).json({ error: "ctaUrl required when ctaTarget is CUSTOM_URL" });
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : null;
    if (end && end <= start) return res.status(400).json({ error: "endDate must be after startDate" });
    if (type === "ROTATING") {
      const activeCount = await prisma.dealerBanner.count({
        where: { dealerId: req.dealer.id, type: "ROTATING", isActive: true },
      });
      if (activeCount >= MAX_ACTIVE_ROTATING) return res.status(400).json({ error: `Maximum ${MAX_ACTIVE_ROTATING} active rotating banners` });
    }
    const banner = await prisma.dealerBanner.create({
      data: {
        dealerId: req.dealer.id,
        type,
        title: String(title).trim(),
        description: description != null ? String(description).trim() : null,
        imageUrl: imageUrl?.trim() || null,
        ctaText: ctaText?.trim() || null,
        ctaTarget: target,
        ctaUrl: ctaUrl?.trim() || null,
        startDate: start,
        endDate: end,
        isActive: isActive !== false,
        displayOrder: displayOrder != null ? Number(displayOrder) : 0,
        backgroundColor: backgroundColor?.trim() || null,
        textColor: textColor?.trim() || null,
      },
    });
    res.status(201).json(banner);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create banner" });
  }
});

/** PATCH /api/banners/:id — update banner */
bannersRouter.patch("/:id", async (req, res) => {
  try {
    const existing = await prisma.dealerBanner.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
    });
    if (!existing) return res.status(404).json({ error: "Banner not found" });
    const {
      type,
      title,
      description,
      imageUrl,
      ctaText,
      ctaTarget,
      ctaUrl,
      startDate,
      endDate,
      isActive,
      displayOrder,
      backgroundColor,
      textColor,
    } = req.body || {};
    const target = ctaTarget !== undefined ? (ctaTarget || "NONE") : existing.ctaTarget;
    if (target === "CUSTOM_URL" && !(ctaUrl !== undefined ? ctaUrl?.trim() : existing.ctaUrl)) return res.status(400).json({ error: "ctaUrl required when ctaTarget is CUSTOM_URL" });
    const start = startDate ? new Date(startDate) : existing.startDate;
    const end = endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate;
    if (end && end <= start) return res.status(400).json({ error: "endDate must be after startDate" });
    const banner = await prisma.dealerBanner.update({
      where: { id: req.params.id },
      data: {
        ...(type && ["ROTATING", "FLASH_SALE", "HEADLINE"].includes(type) && { type }),
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && { description: description != null ? String(description).trim() : null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
        ...(ctaText !== undefined && { ctaText: ctaText?.trim() || null }),
        ...(ctaTarget !== undefined && ["NONE", "INVENTORY", "FINANCING", "CONTACT", "CUSTOM_URL"].includes(ctaTarget) && { ctaTarget: ctaTarget || "NONE" }),
        ...(ctaUrl !== undefined && { ctaUrl: ctaUrl?.trim() || null }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
        ...(backgroundColor !== undefined && { backgroundColor: backgroundColor?.trim() || null }),
        ...(textColor !== undefined && { textColor: textColor?.trim() || null }),
      },
    });
    res.json(banner);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update banner" });
  }
});

/** DELETE /api/banners/:id */
bannersRouter.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.dealerBanner.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
    });
    if (!existing) return res.status(404).json({ error: "Banner not found" });
    await prisma.dealerBanner.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete banner" });
  }
});
