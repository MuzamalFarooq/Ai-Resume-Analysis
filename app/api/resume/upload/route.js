import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Resume from "@/models/Resume";
import { requireAuth } from "@/lib/session";
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

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await requireAuth();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be under 8MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedText = await parseResumeFile(buffer, file.type);
    const basicSkills = extractSkillsFromText(parsedText);

    const extractedData = await extractResumeData(parsedText);
    const aiAnalysis = await analyzeResumeWithAI(parsedText, extractedData);

    const allSkills = [...new Set([...(extractedData.skills || []), ...basicSkills])];
    const readabilityScore = calculateReadability(parsedText);
    const formattingScore = analyzeFormatting(parsedText);
    const grammarResult = analyzeGrammar(parsedText);
    const formattingIssues = getFormattingIssues(parsedText);
    const sectionScores = calculateSectionScores(parsedText, extractedData);
    const atsScore = calculateATSScore(parsedText, extractedData);

    await connectDB();

    const resume = await Resume.create({
      userId: user.id,
      fileName: file.name,
      fileUrl: `local://${file.name}`,
      fileType: file.type,
      parsedText,
      extractedData,
      extractedSkills: allSkills,
      atsScore,
      grammarScore: grammarResult.score,
      readabilityScore,
      formattingScore,
      sectionScores: aiAnalysis.sectionScores || sectionScores,
      recommendations: aiAnalysis.recommendations || [],
      grammarIssues: aiAnalysis.grammarIssues || grammarResult.issues,
      formattingIssues,
      aiImprovements: aiAnalysis.aiImprovements || {},
      careerRecommendations: aiAnalysis.careerRecommendations || {},
      status: "completed",
    });

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "OPENAI_API_KEY missing") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
