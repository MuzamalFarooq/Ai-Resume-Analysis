import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(filename) {
  const envPath = resolve(root, filename);
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");

async function testUploadFlow() {
  console.log("=== Testing Resume Upload & Analysis Flow ===");

  const sampleResumeText = `
Alex Johnson
Email: alex.johnson@example.com | Phone: (555) 987-6543 | New York, NY
LinkedIn: linkedin.com/in/alexjohnson | GitHub: github.com/alexj

SUMMARY
Dedicated Software Engineer with 4+ years of hands-on experience designing and building scalable web applications. Proficient in modern JavaScript ecosystems, React, Next.js, and cloud backend systems.

EXPERIENCE
Software Engineer - NexaTech Labs (2022 - Present)
- Spearheaded migration of legacy web app to Next.js, cutting page load times by 40%.
- Designed REST APIs with Node.js and MongoDB serving 500k+ monthly active users.
- Automated CI/CD deployment pipelines using GitHub Actions and Docker.

Junior Developer - CodeCraft Solutions (2020 - 2022)
- Built responsive UI components with React and Tailwind CSS.
- Optimized database queries in PostgreSQL, improving query response time by 25%.

PROJECTS
AI Resume Analyzer
- Full-stack AI platform built with Next.js, MongoDB, and Grok AI for instant ATS scoring.

EDUCATION
Bachelor of Science in Information Technology - New York University (2016 - 2020)

SKILLS
JavaScript, TypeScript, React, Next.js, Node.js, Express, MongoDB, PostgreSQL, Tailwind, Docker, Git, AWS
`;

  try {
    const { connectDB } = await import("../lib/mongodb.js");
    await connectDB();
    console.log("Database connected.");

    const {
      calculateATSScore,
      calculateReadability,
      analyzeFormatting,
      analyzeGrammar,
      getFormattingIssues,
      calculateSectionScores,
    } = await import("../lib/ats-scorer.js");

    const { extractResumeData, analyzeResumeWithAI } = await import("../lib/grok.js");
    const { extractSkillsFromText } = await import("../lib/resume-parser.js");
    const Resume = (await import("../models/Resume.js")).default;
    const User = (await import("../models/User.js")).default;

    const user = await User.findOne({ email: "muzamalfarooq@gmail.com" });
    if (!user) {
      console.error("Test user not found.");
      return;
    }

    console.log("1. Extracting resume data...");
    const extractedData = await extractResumeData(sampleResumeText);
    console.log("Extracted Data:", {
      name: extractedData.name,
      skills: extractedData.skills?.slice(0, 5),
      experienceCount: extractedData.experience?.length,
    });

    console.log("2. Running AI analysis...");
    const aiAnalysis = await analyzeResumeWithAI(sampleResumeText, extractedData);
    console.log("Analysis Output:", {
      recommendationsCount: aiAnalysis.recommendations?.length,
      sectionScores: aiAnalysis.sectionScores,
    });

    const basicSkills = extractSkillsFromText(sampleResumeText);
    const allSkills = [...new Set([...(extractedData.skills || []), ...basicSkills])];
    const readabilityScore = calculateReadability(sampleResumeText);
    const formattingScore = analyzeFormatting(sampleResumeText);
    const grammarResult = analyzeGrammar(sampleResumeText);
    const formattingIssues = getFormattingIssues(sampleResumeText);
    const sectionScores = calculateSectionScores(sampleResumeText, extractedData);
    const atsScore = calculateATSScore(sampleResumeText, extractedData);

    console.log("3. Calculated Scores:", {
      atsScore,
      readabilityScore,
      formattingScore,
      grammarScore: grammarResult.score,
    });

    console.log("4. Creating Resume Document in DB...");
    const resume = await Resume.create({
      userId: user._id,
      fileName: "sample_resume.pdf",
      fileUrl: "local://sample_resume.pdf",
      fileType: "application/pdf",
      parsedText: sampleResumeText,
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

    console.log("Resume created successfully with ID:", resume._id.toString());

    // Clean up test resume
    await Resume.deleteOne({ _id: resume._id });
    console.log("Test resume cleaned up.");
    console.log("\n=== Full upload & analysis pipeline passed successfully! ===");
  } catch (error) {
    console.error("Test pipeline error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

testUploadFlow();
