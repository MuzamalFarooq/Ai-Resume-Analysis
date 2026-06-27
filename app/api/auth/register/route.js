import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeObject } from "@/utils/sanitize";

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const limit = rateLimit(`register-${ip}`, 5, 3600000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = sanitizeObject(await request.json());
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validated.data;

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const role = adminEmail && email.toLowerCase() === adminEmail.toLowerCase()
      ? "admin"
      : "user";

    const user = await User.create({ name, email, password, role });

    return NextResponse.json(
      { message: "Account created successfully", user: { id: user._id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
