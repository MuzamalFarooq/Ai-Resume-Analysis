import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ResumeBuilderSession from "@/models/ResumeBuilderSession";
import { requireAuth } from "@/lib/session";

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { generatedResume, title } = body;

    if (!generatedResume) {
      return NextResponse.json({ error: "generatedResume is required" }, { status: 400 });
    }

    await connectDB();

    const session = await ResumeBuilderSession.findOne({ _id: id, userId: user.id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    session.generatedResume = {
      ...session.generatedResume?.toObject(),
      ...generatedResume,
      lastGeneratedAt: new Date(),
    };

    if (title) {
      session.title = title;
    }

    await session.save();

    return NextResponse.json({ success: true, session });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[ResumeBuilder] Save resume error:", error);
    return NextResponse.json({ error: "Failed to save resume edits" }, { status: 500 });
  }
}
