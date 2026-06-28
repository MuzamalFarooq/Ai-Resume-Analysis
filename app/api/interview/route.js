import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Resume from "@/models/Resume";
import InterviewSession from "@/models/InterviewSession";
import { requireAuth } from "@/lib/session";
import { generateInterviewQuestions } from "@/lib/openai";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeInput } from "@/utils/sanitize";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await requireAuth();
    const limit = rateLimit(`interview-${user.id}`, 10, 3600000);
    if (!limit.success) {
      return NextResponse.json({ error: "Rate limit reached" }, { status: 429 });
    }

    const body = await request.json();
    const { targetRole, resumeId, questionCount = 15 } = body;
    const normalizedCount = Number.isFinite(Number(questionCount))
      ? Math.round(Number(questionCount))
      : 15;
    const questionLimit = Math.min(20, Math.max(10, normalizedCount));

    if (!targetRole) {
      return NextResponse.json({ error: "Target role is required" }, { status: 400 });
    }

    await connectDB();

    let skills = [];
    let projects = [];
    let resumeText = "";
    let linkedResumeId = resumeId;

    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, userId: user.id });
      if (resume) {
        skills = resume.extractedSkills || [];
        projects = resume.extractedData?.projects || [];
        resumeText = resume.parsedText || "";
      }
    } else {
      const latestResume = await Resume.findOne({ userId: user.id, status: "completed" })
        .sort({ createdAt: -1 });
      if (latestResume) {
        skills = latestResume.extractedSkills || [];
        projects = latestResume.extractedData?.projects || [];
        resumeText = latestResume.parsedText || "";
        linkedResumeId = latestResume._id;
      }
    }

    const questions = await generateInterviewQuestions({
      skills,
      projects,
      resumeText,
      targetRole: sanitizeInput(targetRole),
      count: questionLimit,
    });

    const session = await InterviewSession.create({
      userId: user.id,
      resumeId: linkedResumeId,
      targetRole: sanitizeInput(targetRole),
      questions,
      status: "in_progress",
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "OPENAI_API_KEY missing") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Create interview error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate interview questions" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const user = await requireAuth();
    await connectDB();

    const sessions = await InterviewSession.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-questions -answers");

    return NextResponse.json({ sessions });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get interviews error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
