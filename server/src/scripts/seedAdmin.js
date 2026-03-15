/**
 * Seed MotorIQ admin accounts.
 * Run from server directory: npm run seed:admin
 * Creates:
 *   - admin@motoriq.co.ke / MotorIQ@Admin2024
 *   - josegikaara@gmail.com / MotorIQ@Admin2024 (change after first login)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.js";

const ADMINS = [
  { email: "admin@motoriq.co.ke", password: "MotorIQ@Admin2024", name: "MotorIQ Admin" },
  { email: "josegikaara@gmail.com", password: "MotorIQ@Admin2024", name: "Jose Gikaara" },
];

async function seedAdmin() {
  try {
    // SystemSettings singleton — always one row with id='singleton'
    await prisma.systemSettings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    console.log("SystemSettings singleton ensured.");

    for (const { email, password, name } of ADMINS) {
      const existing = await prisma.admin.findUnique({ where: { email } });
      if (existing) {
        console.log("Admin already exists:", email, "- skipping.");
        continue;
      }
      const hashed = await bcrypt.hash(password, 10);
      const admin = await prisma.admin.create({
        data: { email, password: hashed, name },
      });
      console.log("Admin created:", admin.email, "| Name:", admin.name);
    }
    console.log("\nLogin at: https://motoiq.vercel.app/admin/login (or localhost:5173/admin/login)");
    console.log("Default password for both: MotorIQ@Admin2024 — change after first login.");
    process.exit(0);
  } catch (e) {
    console.error("Seed failed:", e?.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
