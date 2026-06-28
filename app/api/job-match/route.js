import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Resume from "@/models/Resume";
import JobDescription from "@/models/JobDescription";
import { requireAuth } from "@/lib/session";
import { jobDescriptionSchema } from "@/lib/validations";
import { matchJobDescription } from "@/lib/openai";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeInput } from "@/utils/sanitize";

export async function POST(request) {
  try {
    const user = await requireAuth();
    const limit = rateLimit(`jobmatch-${user.id}`, 15, 3600000);
    if (!limit.success) {
      return NextResponse.json({ error: "Rate limit reached" }, { status: 429 });
    }

    const body = await request.json();
    const validated = jobDescriptionSchema.safeParse({
      ...body,
      text: sanitizeInput(body.text),
      title: body.title ? sanitizeInput(body.title) : undefined,
    });

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { text, title, resumeId } = validated.data;

    await connectDB();

    let resumeText = "";
    let resumeSkills = [];

    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, userId: user.id });
      if (resume) {
        resumeText = resume.parsedText || "";
        resumeSkills = resume.extractedSkills || [];
      }
    } else {
      const latestResume = await Resume.findOne({ userId: user.id, status: "completed" })
        .sort({ createdAt: -1 });
      if (latestResume) {
        resumeText = latestResume.parsedText || "";
        resumeSkills = latestResume.extractedSkills || [];
        validated.data.resumeId = latestResume._id.toString();
      }
    }

    if (!resumeText) {
      return NextResponse.json(
        { error: "No analyzed resume found. Please upload and analyze a resume first." },
        { status: 400 }
      );
    }

    let matchResult = {
      matchScore: 0,
      extractedKeywords: [],
      matchedSkills: [],
      missingSkills: [],
      recommendedSkills: [],
      suggestions: [],
    };

    if (process.env.OPENAI_API_KEY) {
      matchResult = await matchJobDescription(resumeText, text, resumeSkills);
    } else {
      const jdWords = text.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const uniqueKeywords = [...new Set(jdWords)].slice(0, 20);
      const matched = resumeSkills.filter((s) =>
        text.toLowerCase().includes(s.toLowerCase())
      );
      matchResult = {
        matchScore: Math.round((matched.length / Math.max(resumeSkills.length, 1)) * 100),
        extractedKeywords: uniqueKeywords,
        matchedSkills: matched,
        missingSkills: uniqueKeywords.filter(
          (k) => !resumeText.toLowerCase().includes(k)
        ).slice(0, 10),
        recommendedSkills: [],
        suggestions: ["Upload resume with OpenAI API key configured for better matching"],
      };
    }

    const jobMatch = await JobDescription.create({
      userId: user.id,
      resumeId: validated.data.resumeId,
      title: title || "Job Match",
      text,
      ...matchResult,
    });

    return NextResponse.json({ jobMatch }, { status: 201 });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Job match error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const user = await requireAuth();
    await connectDB();

    const jobMatches = await JobDescription.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-text");

    return NextResponse.json({ jobMatches });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get job matches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
