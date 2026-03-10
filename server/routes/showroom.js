import { Router } from "express";
import prisma from "../lib/prisma.js";

export const showroomRouter = Router();

showroomRouter.get("/:dealerId", async (req, res) => {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { id: req.params.dealerId },
      select: { id: true, dealershipName: true, phone: true, logoUrl: true, primaryColor: true, tagline: true, city: true, website: true },
    });
    if (!dealer) return res.status(404).json({ error: "Dealer not found" });
    const cars = await prisma.car.findMany({
      where: { dealerId: req.params.dealerId, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    res.json({ dealer, cars });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch showroom" });
  }
});
