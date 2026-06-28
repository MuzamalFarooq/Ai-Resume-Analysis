import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validations";
import { generateToken } from "@/utils/cn";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const limit = rateLimit(`forgot-${ip}`, 3, 3600000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const validated = forgotPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: validated.data.email.toLowerCase() });

    if (user) {
      const resetToken = generateToken();
      user.resetToken = resetToken;
      user.resetTokenExpiry = new Date(Date.now() + 3600000);
      await user.save();

      // In production, send email with reset link
      console.log(`Reset token for ${user.email}: ${resetToken}`);
    }

    return NextResponse.json({
      message: "If an account exists, a reset link has been sent",
      // Dev only - remove in production
      ...(process.env.NODE_ENV === "development" && user
        ? { resetToken: user.resetToken }
        : {}),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
