import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { requireAuth } from "@/lib/session";
import { interviewAnswerSchema } from "@/lib/validations";
import { evaluateInterviewAnswer, generateInterviewFeedback } from "@/lib/openai";
import { sanitizeInput } from "@/utils/sanitize";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    const user = await requireAuth();
    const limit = rateLimit(`evaluate-${user.id}`, 50, 3600000);
    if (!limit.success) {
      return NextResponse.json({ error: "Rate limit reached" }, { status: 429 });
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

    let evaluation = {
      score: 70,
      feedback: "Good answer. Consider adding more specific examples and quantifiable results.",
      accuracy: 70,
      communication: 75,
      confidence: 70,
      clarity: 72,
    };

    if (process.env.OPENAI_API_KEY) {
      try {
        evaluation = await evaluateInterviewAnswer(
          question.question,
          answer,
          session.targetRole
        );
      } catch (err) {
        console.error("Interview answer evaluation failed, using fallback evaluation:", err);
      }
    }

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
      const avgScore =
        session.answers.reduce((sum, a) => sum + (a.score || 0), 0) /
        session.answers.length;

      let overallFeedback = { score: Math.round(avgScore), feedback: "Interview completed." };

      if (process.env.OPENAI_API_KEY) {
        try {
          overallFeedback = await generateInterviewFeedback(
            session.answers,
            session.targetRole
          );
        } catch (err) {
          console.error("Interview feedback generation failed, using fallback summary:", err);
        }
      }

      session.score = overallFeedback.score || Math.round(avgScore);
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
    console.error("Evaluate answer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
