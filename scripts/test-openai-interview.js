/**
 * Manual OpenAI integration test.
 * Usage: node scripts/test-openai-interview.js
 * Requires OPENAI_API_KEY in .env.local or environment.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { generateInterviewQuestions } from "../lib/openai.js";

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
john.doe@email.com | (555) 123-4567

SUMMARY
Full-stack developer with 4 years of experience building React and Node.js applications.

EXPERIENCE
Software Engineer, Tech Corp (2021-Present)
- Built REST APIs with Node.js and Express serving 50k daily users
- Developed React dashboards with TypeScript and Tailwind CSS
- Reduced page load time by 35% through code splitting and caching

PROJECTS
E-Commerce Platform - Next.js, MongoDB, Stripe integration
Task Manager App - React, Firebase, real-time updates

SKILLS
JavaScript, TypeScript, React, Next.js, Node.js, MongoDB, PostgreSQL, Git, AWS
`;

async function main() {
  console.log("=== OpenAI Interview Question Test ===");
  console.log("OPENAI_API_KEY present:", Boolean(process.env.OPENAI_API_KEY));

  const questions = await generateInterviewQuestions({
    skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    projects: ["E-Commerce Platform", "Task Manager App"],
    resumeText: sampleResumeText,
    targetRole: "Full Stack Developer",
    count: 5,
  });

  console.log("\nGenerated", questions.length, "questions:\n");
  questions.forEach((q, i) => {
    console.log(`${i + 1}. [${q.type}] ${q.question}`);
  });

  console.log("\nTest passed.");
}

main().catch((err) => {
  console.error("\nTest failed:", err.message);
  process.exit(1);
});
