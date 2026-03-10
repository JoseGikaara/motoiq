/**
 * Seed the MotorIQ admin account.
 * Run from server directory: npm run seed:admin
 * Creates: admin@motoriq.co.ke / MotorIQ@Admin2024
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.js";

const ADMIN_EMAIL = "admin@motoriq.co.ke";
const ADMIN_PASSWORD = "MotorIQ@Admin2024";
const ADMIN_NAME = "MotorIQ Admin";

async function seedAdmin() {
  try {
    // SystemSettings singleton — always one row with id='singleton'
    await prisma.systemSettings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    console.log("SystemSettings singleton ensured.");

    const existing = await prisma.admin.findUnique({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      console.log("Admin already exists:", ADMIN_EMAIL);
      console.log("Skipping seed. Use a different email or delete the existing admin to re-seed.");
      process.exit(0);
      return;
    }
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const admin = await prisma.admin.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashed,
        name: ADMIN_NAME,
      },
    });
    console.log("Admin account created successfully.");
    console.log("  Email:", admin.email);
    console.log("  Name:", admin.name);
    console.log("  ID:", admin.id);
    console.log("\nLogin at: http://localhost:5173/admin/login");
    console.log("Change this password immediately after first login.");
    process.exit(0);
  } catch (e) {
    console.error("Seed failed:", e?.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
