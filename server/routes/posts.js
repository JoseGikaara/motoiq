import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

export const postsRouter = Router();

postsRouter.use(requireAuth);

postsRouter.get("/", async (req, res) => {
  try {
    const posts = await prisma.generatedPost.findMany({
      where: {
        car: { dealerId: req.dealer.id },
      },
      include: {
        car: {
          select: { id: true, make: true, model: true, year: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(posts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load posts" });
  }
});

