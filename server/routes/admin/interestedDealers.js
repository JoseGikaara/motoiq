import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();
router.use(adminAuth);

router.get("/", async (req, res) => {
  try {
    const status = req.query.status;
    const where = status && ["NEW", "CONTACTED", "CONVERTED"].includes(status) ? { status } : {};
    const list = await prisma.interestedDealer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(list);
  } catch (e) {
    console.error("Admin interested dealers list error:", e);
    res.status(500).json({ error: "Failed to load interested dealers" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["NEW", "CONTACTED", "CONVERTED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const updated = await prisma.interestedDealer.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(updated);
  } catch (e) {
    console.error("Admin interested dealer update error:", e);
    res.status(500).json({ error: "Failed to update interested dealer" });
  }
});

export default router;

