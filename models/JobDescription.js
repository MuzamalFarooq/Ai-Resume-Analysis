import mongoose from "mongoose";

const JobDescriptionSchema = new mongoose.Schema(
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
    title: String,
    text: { type: String, required: true },
    extractedKeywords: [String],
    matchScore: { type: Number, default: 0 },
    matchedSkills: [String],
    missingSkills: [String],
    recommendedSkills: [String],
    suggestions: [String],
  },
  { timestamps: true }
);

export default mongoose.models.JobDescription ||
  mongoose.model("JobDescription", JobDescriptionSchema);
