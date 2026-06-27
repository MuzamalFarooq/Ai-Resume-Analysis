import mongoose from "mongoose";

const SectionScoreSchema = new mongoose.Schema(
  {
    summary: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
    skills: { type: Number, default: 0 },
    education: { type: Number, default: 0 },
  },
  { _id: false }
);

const ExtractedDataSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    education: [String],
    experience: [String],
    projects: [String],
    certifications: [String],
  },
  { _id: false }
);

const GrammarIssueSchema = new mongoose.Schema(
  {
    type: String,
    text: String,
    suggestion: String,
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  },
  { _id: false }
);

const FormattingIssueSchema = new mongoose.Schema(
  {
    category: String,
    issue: String,
    suggestion: String,
  },
  { _id: false }
);

const ResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: String,
    fileUrl: { type: String, required: true },
    fileType: String,
    parsedText: String,
    extractedData: ExtractedDataSchema,
    extractedSkills: [String],
    atsScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    readabilityScore: { type: Number, default: 0 },
    formattingScore: { type: Number, default: 0 },
    sectionScores: SectionScoreSchema,
    recommendations: [String],
    grammarIssues: [GrammarIssueSchema],
    formattingIssues: [FormattingIssueSchema],
    aiImprovements: {
      summary: String,
      bulletPoints: [String],
      projectDescriptions: [String],
    },
    careerRecommendations: {
      jobRoles: [String],
      certifications: [String],
      skillsToLearn: [String],
      roadmap: [String],
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Resume || mongoose.model("Resume", ResumeSchema);
