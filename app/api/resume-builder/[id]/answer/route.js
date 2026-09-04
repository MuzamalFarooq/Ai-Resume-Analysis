import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ResumeBuilderSession from "@/models/ResumeBuilderSession";
import { requireAuth } from "@/lib/session";
import { updateProfileWithAnswer, generateNextInterviewQuestion } from "@/lib/resume-builder-ai";

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { answer } = body;

    if (typeof answer !== "string" || !answer.trim()) {
      return NextResponse.json({ error: "Answer cannot be empty" }, { status: 400 });
    }

    await connectDB();

    const session = await ResumeBuilderSession.findOne({ _id: id, userId: user.id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const currentQuestion = session.currentQuestion || {
      id: `q_${Date.now()}`,
      question: "General details",
      category: "experience",
    };

    // 1. Update structured profile with the user's answer
    const updatedProfile = await updateProfileWithAnswer({
      currentProfile: session.detectedProfile?.toObject ? session.detectedProfile.toObject() : session.detectedProfile,
      question: currentQuestion,
      answer: answer.trim(),
    });

    // 2. Record in question history
    const historyItem = {
      id: currentQuestion.id,
      question: currentQuestion.question,
      category: currentQuestion.category || "general",
      answer: answer.trim(),
      skipped: false,
      timestamp: new Date(),
    };

    const newHistory = [...(session.questionHistory || []), historyItem];

    // 3. Generate the next intelligent question or check for completeness
    const nextQuestionResult = await generateNextInterviewQuestion({
      profile: updatedProfile,
      history: newHistory,
      latestAnswer: answer.trim(),
    });

    session.detectedProfile = updatedProfile;
    session.questionHistory = newHistory;
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
    console.error("[ResumeBuilder] Answer submission error:", error);
    return NextResponse.json({ error: "Failed to process answer" }, { status: 500 });
  }
}
