import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get("/count", async (req, res) => {
  try {
    const count = await prisma.task.count({
      where: { dealerId: req.dealer.id, done: false },
    });
    res.json({ count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch task count" });
  }
});

tasksRouter.get("/", async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { dealerId: req.dealer.id, done: false },
      include: { lead: { include: { car: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

tasksRouter.patch("/:id/done", async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
    });
    if (!task) return res.status(404).json({ error: "Task not found" });
    await prisma.task.update({
      where: { id: task.id },
      data: { done: true },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update task" });
  }
});
