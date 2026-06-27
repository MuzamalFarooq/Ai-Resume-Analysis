import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Resume from "@/models/Resume";
import { parseResumeFile, extractSkillsFromText } from "@/lib/resume-parser";
import {
  calculateATSScore,
  calculateReadability,
  analyzeFormatting,
  analyzeGrammar,
  getFormattingIssues,
  calculateSectionScores,
} from "@/lib/ats-scorer";
import { extractResumeData, analyzeResumeWithAI } from "@/lib/openai";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    const body = await request.json();
    const { resumeId } = body;

    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID required" }, { status: 400 });
    }

    await connectDB();
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const limit = rateLimit(`analysis-${resume.userId}`, 20, 3600000);
    if (!limit.success) {
      return NextResponse.json({ error: "Analysis limit reached" }, { status: 429 });
    }

    resume.status = "processing";
    await resume.save();

    try {
      const response = await fetch(resume.fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const parsedText = await parseResumeFile(buffer, resume.fileType);
      const basicSkills = extractSkillsFromText(parsedText);

      let extractedData = {};
      let aiAnalysis = {};

      if (process.env.OPENAI_API_KEY) {
        try {
          extractedData = await extractResumeData(parsedText);
          aiAnalysis = await analyzeResumeWithAI(parsedText, extractedData);
        } catch (aiError) {
          console.error("AI analysis error:", aiError);
          extractedData = { skills: basicSkills };
        }
      } else {
        extractedData = { skills: basicSkills };
      }

      const allSkills = [
        ...new Set([...(extractedData.skills || []), ...basicSkills]),
      ];

      const readabilityScore = calculateReadability(parsedText);
      const formattingScore = analyzeFormatting(parsedText);
      const grammarResult = analyzeGrammar(parsedText);
      const formattingIssues = getFormattingIssues(parsedText);
      const sectionScores = calculateSectionScores(parsedText, extractedData);
      const atsScore = calculateATSScore(parsedText, extractedData);

      resume.parsedText = parsedText;
      resume.extractedData = extractedData;
      resume.extractedSkills = allSkills;
      resume.atsScore = atsScore;
      resume.grammarScore = grammarResult.score;
      resume.readabilityScore = readabilityScore;
      resume.formattingScore = formattingScore;
      resume.sectionScores = aiAnalysis.sectionScores || sectionScores;
      resume.recommendations = aiAnalysis.recommendations || [
        "Add quantifiable achievements to experience bullets",
        "Include a professional summary at the top",
        "Ensure consistent formatting throughout",
        "Add relevant keywords from target job descriptions",
        "Include links to projects or portfolio",
      ];
      resume.grammarIssues = aiAnalysis.grammarIssues || grammarResult.issues;
      resume.formattingIssues = formattingIssues;
      resume.aiImprovements = aiAnalysis.aiImprovements || {};
      resume.careerRecommendations = aiAnalysis.careerRecommendations || {};
      resume.status = "completed";

      await resume.save();

      return NextResponse.json({ resume });
    } catch (parseError) {
      resume.status = "failed";
      await resume.save();
      throw parseError;
    }
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get("resumeId");

    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID required" }, { status: 400 });
    }

    await connectDB();
    const resume = await Resume.findById(resumeId).select("-parsedText");

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("Get analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
