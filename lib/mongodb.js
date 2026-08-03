import mongoose from "mongoose";
import dns from "dns";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/ai-resume-analyzer";

  if (cached.conn) return cached.conn;

  // Try setting public DNS servers if using SRV records on Windows/local network
  if (MONGODB_URI.startsWith("mongodb+srv://")) {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // Ignore if setServers fails in constrained runtime
    }
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("Primary MongoDB connection error:", error.message);

    // Fallback to local MongoDB if primary URI fails in development
    const LOCAL_URI = "mongodb://127.0.0.1:27017/ai-resume-analyzer";
    if (MONGODB_URI !== LOCAL_URI && process.env.NODE_ENV !== "production") {
      console.warn("Attempting fallback to local MongoDB (127.0.0.1:27017)...");
      try {
        cached.promise = mongoose.connect(LOCAL_URI, {
          bufferCommands: false,
          serverSelectionTimeoutMS: 3000,
        });
        cached.conn = await cached.promise;
        console.log("Successfully connected to local MongoDB fallback!");
        return cached.conn;
      } catch (localErr) {
        cached.promise = null;
        console.error("Local MongoDB fallback failed:", localErr.message);
      }
    }

    if (error && /querySrv|ENOTFOUND|ECONNREFUSED|selection timed out/.test(String(error))) {
      throw new Error(
        "Failed to connect to MongoDB database. Please ensure your MongoDB Atlas IP whitelist includes 0.0.0.0/0 or start local MongoDB. Original error: " + error.message
      );
    }
    throw error;
  }

  return cached.conn;
}

