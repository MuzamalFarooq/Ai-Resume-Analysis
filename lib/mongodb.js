import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define MONGODB_URI or DATABASE_URL as an environment variable (set on Vercel as Project Settings → Environment Variables)."
    );
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    // Provide a clearer message for common Atlas DNS / network issues.
    if (error && /querySrv|ENOTFOUND|ECONNREFUSED/.test(String(error))) {
      const friendly = new Error(
        "Failed to connect to MongoDB. If you're using MongoDB Atlas with an SRV connection string (mongodb+srv://), ensure your connection string is correct and your cluster allows connections from your environment (add IP access or use 0.0.0.0/0). Original: " + error.message
      );
      console.error("MongoDB connection error:", error);
      throw friendly;
    }
    throw error;
  }

  return cached.conn;
}
