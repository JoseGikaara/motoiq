import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const dripSequencesRouter = Router();
dripSequencesRouter.use(requireAuth);

/** GET /api/drip-sequences — list sequences for dealer */
dripSequencesRouter.get("/", async (req, res) => {
  try {
    const list = await prisma.dripSequence.findMany({
      where: { dealerId: req.dealer.id },
      include: { steps: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch sequences" });
  }
});

/** GET /api/drip-sequences/active — only active (for enrollment dropdown) */
dripSequencesRouter.get("/active", async (req, res) => {
  try {
    const list = await prisma.dripSequence.findMany({
      where: { dealerId: req.dealer.id, isActive: true },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch sequences" });
  }
});

/** POST /api/drip-sequences — create sequence with steps */
dripSequencesRouter.post("/", async (req, res) => {
  try {
    const { name, description, isActive = true, steps } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });

    const sequence = await prisma.dripSequence.create({
      data: {
        dealerId: req.dealer.id,
        name,
        description: description || null,
        isActive: !!isActive,
        steps: Array.isArray(steps) && steps.length
          ? {
              create: steps.map((s, i) => ({
                order: s.order ?? i + 1,
                triggerAfterDays: s.triggerAfterDays ?? 0,
                channel: s.channel ?? "SMS",
                templateText: s.templateText ?? "",
                useAI: !!s.useAI,
              })),
            }
          : undefined,
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    res.status(201).json(sequence);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create sequence" });
  }
});

/** GET /api/drip-sequences/:id */
dripSequencesRouter.get("/:id", async (req, res) => {
  try {
    const seq = await prisma.dripSequence.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (!seq) return res.status(404).json({ error: "Sequence not found" });
    res.json(seq);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch sequence" });
  }
});

/** PATCH /api/drip-sequences/:id */
dripSequencesRouter.patch("/:id", async (req, res) => {
  try {
    const { name, description, isActive, steps } = req.body;
    const seq = await prisma.dripSequence.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
    });
    if (!seq) return res.status(404).json({ error: "Sequence not found" });

    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.isActive = !!isActive;

    if (Array.isArray(steps)) {
      await prisma.dripStep.deleteMany({ where: { sequenceId: seq.id } });
      if (steps.length) {
        await prisma.dripStep.createMany({
          data: steps.map((s, i) => ({
            sequenceId: seq.id,
            order: s.order ?? i + 1,
            triggerAfterDays: s.triggerAfterDays ?? 0,
            channel: s.channel ?? "SMS",
            templateText: s.templateText ?? "",
            useAI: !!s.useAI,
          })),
        });
      }
    }

    const updated = await prisma.dripSequence.update({
      where: { id: seq.id },
      data,
      include: { steps: { orderBy: { order: "asc" } } },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update sequence" });
  }
});

/** DELETE /api/drip-sequences/:id */
dripSequencesRouter.delete("/:id", async (req, res) => {
  try {
    const seq = await prisma.dripSequence.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
    });
    if (!seq) return res.status(404).json({ error: "Sequence not found" });
    await prisma.dripSequence.delete({ where: { id: seq.id } });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete sequence" });
  }
});
