import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

/**
 * GET /api/dealers/slug/:slug — get dealer by website slug (public, no auth).
 * Returns dealer with cars and banners.
 */
router.get("/slug/:slug", async (req, res) => {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { websiteSlug: req.params.slug },
      include: {
        cars: true,
        banners: true,
      },
    });
    if (!dealer) {
      return res.status(404).json({ error: "Dealer not found" });
    }
    res.json(dealer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export { router as dealersRouter };
