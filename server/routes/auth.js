import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const dealer = await prisma.dealer.findUnique({ where: { email } });
    if (!dealer || !(await bcrypt.compare(password, dealer.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!dealer.isActive) {
      return res.status(403).json({ error: "Account frozen. Please contact support." });
    }
    const token = jwt.sign({ dealerId: dealer.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({
      dealer: { id: dealer.id, name: dealer.name, email: dealer.email, dealershipName: dealer.dealershipName, onboardingComplete: dealer.onboardingComplete },
      token,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});
