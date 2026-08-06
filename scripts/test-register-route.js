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

async function testFullSignupFlow() {
  const { connectDB } = await import("../lib/mongodb.js");
  await connectDB();

  const User = (await import("../models/User.js")).default;
  const testEmail = `newsignup_${Date.now()}@example.com`;
  const rawPassword = "mySecretPassword123!";

  console.log("1. Creating new user via model layer...");
  const newUser = await User.create({
    name: "New Signup User",
    email: testEmail,
    password: rawPassword,
    role: "user",
  });

  console.log("New user created successfully. ID:", newUser._id.toString());

  console.log("2. Verifying password authentication (login)...");
  const foundUser = await User.findOne({ email: testEmail });
  if (!foundUser) {
    throw new Error("Created user not found in database!");
  }

  const isValidPassword = await foundUser.comparePassword(rawPassword);
  console.log("Password match result:", isValidPassword);

  if (!isValidPassword) {
    throw new Error("Password authentication failed!");
  }

  console.log("3. Cleaning up test user...");
  await User.deleteOne({ _id: newUser._id });
  console.log("Cleanup complete. Full signup flow test passed!");

  await mongoose.disconnect();
}

testFullSignupFlow().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
