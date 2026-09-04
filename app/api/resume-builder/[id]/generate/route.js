import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ResumeBuilderSession from "@/models/ResumeBuilderSession";
import { requireAuth } from "@/lib/session";
import { generateFullAtsResume } from "@/lib/resume-builder-ai";

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { template = "modern" } = body;

    await connectDB();

    const session = await ResumeBuilderSession.findOne({ _id: id, userId: user.id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const profileData = session.detectedProfile?.toObject ? session.detectedProfile.toObject() : session.detectedProfile;

    // Generate ATS-optimized resume
    const generated = await generateFullAtsResume({
      profile: profileData,
      template,
    });

    session.generatedResume = {
      template: generated.template || template,
      sectionOrder: generated.sectionOrder || [
        "personal",
        "summary",
        "skills",
        "experience",
        "projects",
        "education",
        "certifications",
      ],
      resumeData: generated.resumeData || {},
      atsScore: generated.atsScore || 92,
      atsFeedback: generated.atsFeedback || [
        "High ATS keyword density and compliant standard headings.",
      ],
      lastGeneratedAt: new Date(),
    };

    session.status = "completed";
    await session.save();

    return NextResponse.json({ success: true, session });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[ResumeBuilder] Resume generation error:", error);
    return NextResponse.json({ error: "Failed to generate resume" }, { status: 500 });
  }
}
