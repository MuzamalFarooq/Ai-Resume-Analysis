import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(filename) {
  const envPath = resolve(root, filename);
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");

async function checkAdminUser() {
  console.log("Connecting to DB...");
  const { connectDB } = await import("../lib/mongodb.js");
  await connectDB();

  const User = (await import("../models/User.js")).default;
  const adminEmail = process.env.ADMIN_EMAIL || "muzamalfarooq@gmail.com";
  const adminPass = process.env.ADMIN_PASSWORD || "muzamal123";

  console.log("Checking admin account:", adminEmail);
  let user = await User.findOne({ email: adminEmail.toLowerCase() });

  if (!user) {
    console.log("Admin account does not exist. Creating admin account...");
    user = await User.create({
      name: "Admin",
      email: adminEmail.toLowerCase(),
      password: adminPass,
      role: "admin",
    });
    console.log("Admin account created successfully:", user._id);
  } else {
    console.log("Admin user found:", { id: user._id, email: user.email, role: user.role });
    const match = await user.comparePassword(adminPass);
    console.log("Password check for adminPass:", match);
    if (!match) {
      console.log("Updating admin password to match ADMIN_PASSWORD in .env...");
      user.password = adminPass;
      await user.save();
      console.log("Admin password updated.");
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
}

checkAdminUser();
