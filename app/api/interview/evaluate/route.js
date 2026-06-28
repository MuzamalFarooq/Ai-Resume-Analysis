import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { requireAuth } from "@/lib/session";
import { interviewAnswerSchema } from "@/lib/validations";
import { evaluateInterviewAnswer, generateInterviewFeedback } from "@/lib/openai";
import { sanitizeInput } from "@/utils/sanitize";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (user.role !== "user") {
      const limit = rateLimit(`evaluate-${user.id}`, 50, 3600000);
      if (!limit.success) {
        return NextResponse.json({ error: "Rate limit reached" }, { status: 429 });
      }
    }

    const body = await request.json();
    const validated = interviewAnswerSchema.safeParse({
      ...body,
      answer: sanitizeInput(body.answer),
    });

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { sessionId, questionId, answer } = validated.data;

    await connectDB();
    const session = await InterviewSession.findOne({ _id: sessionId, userId: user.id });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const question = session.questions.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const evaluation = await evaluateInterviewAnswer(
      question.question,
      answer,
      session.targetRole
    );

    const answerEntry = {
      questionId,
      answer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      accuracy: evaluation.accuracy,
      communication: evaluation.communication,
      confidence: evaluation.confidence,
      clarity: evaluation.clarity,
    };

    const existingIndex = session.answers.findIndex((a) => a.questionId === questionId);
    if (existingIndex >= 0) {
      session.answers[existingIndex] = answerEntry;
    } else {
      session.answers.push(answerEntry);
    }

    const allAnswered = session.answers.length >= session.questions.length;
    if (allAnswered) {
      const overallFeedback = await generateInterviewFeedback(
        session.answers,
        session.targetRole
      );

      session.score = overallFeedback.score;
      session.feedback = overallFeedback.feedback;
      session.status = "completed";
    }

    await session.save();

    return NextResponse.json({
      evaluation: answerEntry,
      sessionComplete: allAnswered,
      overallScore: session.score,
    });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "OPENAI_API_KEY missing") {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Evaluate answer error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
