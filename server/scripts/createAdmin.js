// server/scripts/createAdmin.js
// Create an Admin row in the database using DATABASE_URL from .env
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Adjust these if you want a different admin
const ADMIN_EMAIL = "josegikaara@gmail.com";
const ADMIN_NAME = "Jose Gikaara";
const ADMIN_PASSWORD = "MotorIQ@Admin2024";

async function main() {
  try {
    console.log("Using DATABASE_URL:", process.env.DATABASE_URL);

    const existing = await prisma.admin.findUnique({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      console.log("Admin already exists with email:", ADMIN_EMAIL);
      return;
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.admin.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashed,
        name: ADMIN_NAME,
      },
    });

    console.log("Admin created successfully.");
    console.log("  Email:", ADMIN_EMAIL);
    console.log("  Password:", ADMIN_PASSWORD, "(change this after first login)");
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

