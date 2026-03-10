import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

/**
 * Verify JWT and require role === "ADMIN". Attach req.admin.
 * Return 403 if not admin.
 */
export async function adminAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Admin token required" });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }
    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { id: true, email: true, name: true },
    });
    if (!admin) {
      return res.status(403).json({ error: "Admin not found" });
    }
    req.admin = admin;
    next();
  } catch (e) {
    if (e.name === "JsonWebTokenError" || e.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired admin token" });
    }
    return res.status(500).json({ error: "Auth check failed" });
  }
}
