import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  assertGrokConfigured,
  extractResumeData,
  analyzeResumeWithAI,
  matchJobDescription,
  generateInterviewQuestions,
} from "../lib/grok.js";

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

loadEnvFile(".env.local");
loadEnvFile(".env");

const sampleResumeText = `
John Doe
Email: john.doe@example.com | Phone: (555) 123-4567 | San Francisco, CA
GitHub: github.com/johndoe | LinkedIn: linkedin.com/in/johndoe

Summary:
Full-stack developer with 5+ years of experience in JavaScript, TypeScript, React, Next.js, and Node.js.

Skills:
JavaScript, TypeScript, React, Next.js, Node.js, Express, MongoDB, PostgreSQL, TailwindCSS, Docker, AWS

Experience:
Senior Software Engineer - Tech Solutions Inc. (2022 - Present)
- Architected and built high-performance web applications using Next.js and TailwindCSS.
- Designed RESTful and GraphQL APIs using Node.js and PostgreSQL.

Projects:
AI Resume Analyzer
- Built full-stack resume analysis platform with Next.js, MongoDB, and Grok AI integration.

Education:
B.S. in Computer Science - University of California, Berkeley (2016 - 2020)
`;

async function runTests() {
  console.log("=== Grok AI Integration Test ===");
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  console.log("GROK_API_KEY / XAI_API_KEY present:", Boolean(apiKey));

  try {
    assertGrokConfigured();
  } catch (err) {
    console.error("Configuration Check:", err.message);
    console.log("Please set your real GROK_API_KEY in .env or .env.local to run full live API tests.");
    return;
  }

  console.log("\n1. Testing Resume Data Extraction...");
  try {
    const extracted = await extractResumeData(sampleResumeText);
    console.log("Extracted candidate name:", extracted.name);
    console.log("Extracted skills count:", extracted.skills?.length);
    console.log("Extracted successfully!");
  } catch (err) {
    console.error("Resume Extraction Error:", err.message || err);
  }

  console.log("\n2. Testing Mock Interview Question Generation...");
  try {
    const questions = await generateInterviewQuestions({
      skills: ["React", "Next.js", "Node.js"],
      projects: ["AI Resume Analyzer"],
      targetRole: "Full Stack Engineer",
      resumeText: sampleResumeText,
      count: 3,
    });
    console.log(`Generated ${questions.length} questions:`);
    questions.forEach((q, idx) => {
      console.log(`  [${idx + 1}] (${q.type}) ${q.question}`);
    });
  } catch (err) {
    console.error("Interview Generation Error:", err.message || err);
  }

  console.log("\n=== Test Completed ===");
}

runTests();
