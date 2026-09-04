import mongoose from "mongoose";

const PersonalInfoSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    targetRole: { type: String, default: "" },
    summary: { type: String, default: "" },
  },
  { _id: false }
);

const EducationItemSchema = new mongoose.Schema(
  {
    institution: { type: String, default: "" },
    degree: { type: String, default: "" },
    fieldOfStudy: { type: String, default: "" },
    location: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    current: { type: Boolean, default: false },
    gpa: { type: String, default: "" },
    highlights: { type: [String], default: [] },
  },
  { _id: false }
);

const ExperienceItemSchema = new mongoose.Schema(
  {
    company: { type: String, default: "" },
    title: { type: String, default: "" },
    location: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    current: { type: Boolean, default: false },
    employmentType: { type: String, default: "Full-time" },
    bullets: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    impact: { type: String, default: "" },
  },
  { _id: false }
);

const ProjectItemSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    description: { type: String, default: "" },
    role: { type: String, default: "" },
    technologies: { type: [String], default: [] },
    bullets: { type: [String], default: [] },
    liveUrl: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    duration: { type: String, default: "" },
  },
  { _id: false }
);

const SkillCategorySchema = new mongoose.Schema(
  {
    category: { type: String, default: "" },
    items: { type: [String], default: [] },
  },
  { _id: false }
);

const CertificationItemSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    issuer: { type: String, default: "" },
    issueDate: { type: String, default: "" },
    expirationDate: { type: String, default: "" },
    credentialUrl: { type: String, default: "" },
  },
  { _id: false }
);

const AchievementItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    date: { type: String, default: "" },
  },
  { _id: false }
);

const ServiceItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    clients: { type: String, default: "" },
    tools: { type: [String], default: [] },
  },
  { _id: false }
);

const PublicationItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    publisher: { type: String, default: "" },
    date: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { _id: false }
);

const LanguageItemSchema = new mongoose.Schema(
  {
    language: { type: String, default: "" },
    proficiency: { type: String, default: "Fluent" },
  },
  { _id: false }
);

const DetectedProfileSchema = new mongoose.Schema(
  {
    industry: { type: String, default: "General" },
    profession: { type: String, default: "Professional" },
    specialization: { type: String, default: "" },
    experienceLevel: { type: String, enum: ["entry", "mid", "senior", "executive", "student"], default: "mid" },
    personalInfo: { type: PersonalInfoSchema, default: () => ({}) },
    education: { type: [EducationItemSchema], default: [] },
    experience: { type: [ExperienceItemSchema], default: [] },
    projects: { type: [ProjectItemSchema], default: [] },
    skills: { type: [SkillCategorySchema], default: [] },
    certifications: { type: [CertificationItemSchema], default: [] },
    achievements: { type: [AchievementItemSchema], default: [] },
    services: { type: [ServiceItemSchema], default: [] },
    publications: { type: [PublicationItemSchema], default: [] },
    languages: { type: [LanguageItemSchema], default: [] },
  },
  { _id: false }
);

const CurrentQuestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "identity",
        "education",
        "experience",
        "projects",
        "skills",
        "certifications",
        "achievements",
        "services",
        "publications",
        "follow_up",
        "completeness",
      ],
      default: "experience",
    },
    inputType: {
      type: String,
      enum: ["text", "textarea", "multiselect", "date", "number"],
      default: "textarea",
    },
    placeholder: { type: String, default: "" },
    suggestions: { type: [String], default: [] },
    whyItMatters: { type: String, default: "" },
    isFollowUp: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const QuestionHistoryItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    category: { type: String, default: "general" },
    answer: { type: String, default: "" },
    skipped: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GeneratedResumeSchema = new mongoose.Schema(
  {
    template: {
      type: String,
      enum: ["modern", "classic", "minimal", "executive"],
      default: "modern",
    },
    sectionOrder: {
      type: [String],
      default: [
        "personal",
        "summary",
        "experience",
        "projects",
        "skills",
        "education",
        "certifications",
        "achievements",
        "languages",
      ],
    },
    resumeData: { type: mongoose.Schema.Types.Mixed, default: {} },
    atsScore: { type: Number, default: 85 },
    atsFeedback: { type: [String], default: [] },
    lastGeneratedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ResumeBuilderSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "Untitled Resume" },
    status: {
      type: String,
      enum: ["interviewing", "review", "generating", "completed"],
      default: "interviewing",
    },
    detectedProfile: { type: DetectedProfileSchema, default: () => ({}) },
    currentQuestion: { type: CurrentQuestionSchema, default: null },
    questionHistory: { type: [QuestionHistoryItemSchema], default: [] },
    completenessScore: { type: Number, default: 15 },
    missingSections: { type: [String], default: [] },
    generatedResume: { type: GeneratedResumeSchema, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.ResumeBuilderSession ||
  mongoose.model("ResumeBuilderSession", ResumeBuilderSessionSchema);
