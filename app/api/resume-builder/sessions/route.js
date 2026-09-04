import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ResumeBuilderSession from "@/models/ResumeBuilderSession";
import { requireAuth } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireAuth();
    await connectDB();

    const sessions = await ResumeBuilderSession.find({ userId: user.id })
      .sort({ updatedAt: -1 })
      .limit(50);

    return NextResponse.json({ sessions });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[ResumeBuilder] Get sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
