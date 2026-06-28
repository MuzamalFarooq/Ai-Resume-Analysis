import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Resume from "@/models/Resume";
import InterviewSession from "@/models/InterviewSession";
import { requireAuth } from "@/lib/session";
import { generateInterviewQuestions } from "@/lib/openai";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeInput } from "@/utils/sanitize";

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
    let linkedResumeId = resumeId;

    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, userId: user.id });
      if (resume) {
        skills = resume.extractedSkills || [];
        projects = resume.extractedData?.projects || [];
      }
    } else {
      const latestResume = await Resume.findOne({ userId: user.id, status: "completed" })
        .sort({ createdAt: -1 });
      if (latestResume) {
        skills = latestResume.extractedSkills || [];
        projects = latestResume.extractedData?.projects || [];
        linkedResumeId = latestResume._id;
      }
    }

    let questions = [];

    try {
      if (process.env.OPENAI_API_KEY) {
        questions = await generateInterviewQuestions(
          skills,
          projects,
          sanitizeInput(targetRole),
          questionLimit
        );
        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error("OpenAI returned no questions");
        }
      } else {
        throw new Error("OPENAI_API_KEY not configured");
      }
    } catch (err) {
      console.error("Interview question generation failed, falling back to static questions:", err);
      questions = generateFallbackQuestions(sanitizeInput(targetRole), skills);
    }

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
    console.error("Create interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

function generateFallbackQuestions(targetRole, skills) {
  const base = [
    { id: "1", question: `Tell me about yourself and why you're interested in the ${targetRole} role.`, type: "hr", category: "Introduction" },
    { id: "2", question: "Describe a challenging project you worked on and how you handled it.", type: "behavioral", category: "Experience" },
    { id: "3", question: "What are your greatest strengths and weaknesses?", type: "hr", category: "Self Assessment" },
    { id: "4", question: "Where do you see yourself in 5 years?", type: "hr", category: "Career Goals" },
    { id: "5", question: "How do you handle tight deadlines and pressure?", type: "behavioral", category: "Work Style" },
    { id: "6", question: "Describe a time you had a conflict with a team member.", type: "behavioral", category: "Teamwork" },
    { id: "7", question: "Why should we hire you for this position?", type: "hr", category: "Motivation" },
    { id: "8", question: "What questions do you have for us?", type: "hr", category: "Closing" },
  ];

  skills.slice(0, 5).forEach((skill, i) => {
    base.push({
      id: `skill-${i}`,
      question: `Explain your experience with ${skill} and provide an example.`,
      type: "technical",
      category: skill,
    });
  });

  return base;
}
