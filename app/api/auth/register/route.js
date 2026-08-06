import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeInput } from "@/utils/sanitize";

export async function POST(request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "anonymous";

    const limit = rateLimit(`register-${ip}`, 30, 3600000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const name = sanitizeInput(body.name || "");
    const email = sanitizeInput(body.email || "").toLowerCase();
    const password = body.password || "";

    const validated = registerSchema.safeParse({ name, email, password });

    if (!validated.success) {
      const errorMessage = validated.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    await connectDB();

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }

      const adminEmail = process.env.ADMIN_EMAIL;
      const role =
        adminEmail && email === adminEmail.toLowerCase()
          ? "admin"
          : "user";

      const user = await User.create({
        name,
        email,
        password,
        role,
      });

      return NextResponse.json(
        {
          message: "Account created successfully",
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          },
        },
        { status: 201 }
      );
    } catch (err) {
      console.error("Register create user error:", err);
      if (err?.code === 11000) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
    }
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
