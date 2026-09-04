import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ResumeBuilderSession from "@/models/ResumeBuilderSession";
import { requireAuth } from "@/lib/session";
import { regenerateResumeSection } from "@/lib/resume-builder-ai";

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { sectionName, currentContent, promptInstruction } = body;

    if (!sectionName) {
      return NextResponse.json({ error: "sectionName is required" }, { status: 400 });
    }

    await connectDB();

    const session = await ResumeBuilderSession.findOne({ _id: id, userId: user.id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const regenerated = await regenerateResumeSection({
      sectionName,
      currentContent,
      promptInstruction,
      profile: session.detectedProfile?.toObject ? session.detectedProfile.toObject() : session.detectedProfile,
    });

    return NextResponse.json({ success: true, regenerated });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[ResumeBuilder] Regenerate section error:", error);
    return NextResponse.json({ error: "Failed to regenerate section" }, { status: 500 });
  }
}
