import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ResumeBuilderSession from "@/models/ResumeBuilderSession";
import { requireAuth } from "@/lib/session";
import { generateNextInterviewQuestion } from "@/lib/resume-builder-ai";

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await connectDB();

    const session = await ResumeBuilderSession.findOne({ _id: id, userId: user.id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const currentQuestion = session.currentQuestion;

    if (currentQuestion) {
      session.questionHistory.push({
        id: currentQuestion.id,
        question: currentQuestion.question,
        category: currentQuestion.category || "general",
        answer: "Skipped",
        skipped: true,
        timestamp: new Date(),
      });
    }

    const nextQuestionResult = await generateNextInterviewQuestion({
      profile: session.detectedProfile?.toObject ? session.detectedProfile.toObject() : session.detectedProfile,
      history: session.questionHistory,
      latestAnswer: "[User Skipped Question]",
    });

    session.completenessScore = nextQuestionResult.completenessScore || session.completenessScore;
    session.missingSections = nextQuestionResult.missingSections || [];

    if (nextQuestionResult.isComplete || !nextQuestionResult.question) {
      session.status = "review";
      session.currentQuestion = null;
    } else {
      session.currentQuestion = nextQuestionResult.question;
    }

    await session.save();

    return NextResponse.json({
      session,
      isComplete: session.status === "review",
      nextQuestion: session.currentQuestion,
    });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[ResumeBuilder] Skip question error:", error);
    return NextResponse.json({ error: "Failed to skip question" }, { status: 500 });
  }
}
