import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

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

async function testRegistration() {
  console.log("MONGODB_URI present:", Boolean(process.env.MONGODB_URI));
  try {
    const { connectDB } = await import("../lib/mongodb.js");
    await connectDB();
    console.log("Database connected successfully.");

    const User = (await import("../models/User.js")).default;
    const testEmail = `testuser_${Date.now()}@example.com`;

    console.log("Attempting to create user:", testEmail);
    const user = await User.create({
      name: "Test User",
      email: testEmail,
      password: "password123",
      role: "user",
    });

    console.log("User created successfully:", user.toObject());

    const isMatch = await user.comparePassword("password123");
    console.log("Password verification match:", isMatch);

    // Clean up test user
    await User.deleteOne({ _id: user._id });
    console.log("Test user cleaned up.");
  } catch (error) {
    console.error("Test registration error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

testRegistration();
