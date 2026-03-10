import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import rateLimit from "express-rate-limit";

const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });
    const token = jwt.sign(
      { adminId: admin.id, role: "ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({
      admin: { id: admin.id, name: admin.name, email: admin.email },
      token,
    });
  } catch (e) {
    console.error("Admin login error:", e);
    res.status(500).json({ error: "Login failed" });
  }
});

authRouter.get("/me", adminAuth, async (req, res) => {
  res.json({ admin: req.admin });
});

export default authRouter;
