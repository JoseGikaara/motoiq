import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dealer = await prisma.dealer.findUnique({
      where: { id: decoded.dealerId },
      select: { id: true, email: true, name: true, dealershipName: true, onboardingComplete: true, isActive: true },
    });
    if (!dealer) return res.status(401).json({ error: "Unauthorized" });
    if (!dealer.isActive) {
      return res.status(403).json({ error: "Account frozen. Please contact support." });
    }
    req.dealer = dealer;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
