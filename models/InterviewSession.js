import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    id: String,
    question: String,
    type: { type: String, enum: ["technical", "hr", "behavioral"], default: "technical" },
    category: String,
  },
  { _id: false }
);

const AnswerSchema = new mongoose.Schema(
  {
    questionId: String,
    answer: String,
    score: Number,
    feedback: String,
    accuracy: Number,
    communication: Number,
    confidence: Number,
    clarity: Number,
  },
  { _id: false }
);

const InterviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
    targetRole: String,
    questions: [QuestionSchema],
    answers: [AnswerSchema],
    score: { type: Number, default: 0 },
    feedback: String,
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.InterviewSession ||
  mongoose.model("InterviewSession", InterviewSessionSchema);
