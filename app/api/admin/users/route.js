import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Resume from "@/models/Resume";
import { requireAdmin } from "@/lib/session";

export async function GET(request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const resumeCount = await Resume.countDocuments({ userId: user._id });
        return {
          ...user.toJSON(),
          resumeCount,
        };
      })
    );

    return NextResponse.json({
      users: usersWithStats,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await requireAdmin();
    const { userId, role } = await request.json();

    if (!userId || !["user", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: user.toJSON() });
  } catch (error) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await connectDB();
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
