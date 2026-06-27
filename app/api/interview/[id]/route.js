import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { requireAuth } from "@/lib/session";

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await connectDB();
    const session = await InterviewSession.findOne({ _id: id, userId: user.id });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
