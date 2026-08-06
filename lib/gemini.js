import { GoogleGenAI } from "@google/genai";

const MODELS_TO_TRY = [
  process.env.GEMINI_MODEL,
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-flash-lite-latest",
  "gemini-2.0-flash-lite",
].filter(Boolean);

let aiClient = null;

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GEMENI_API || "";
}

export function assertGeminiConfigured() {
  const apiKey = getGeminiApiKey();
  console.log("[Gemini] API Key present:", Boolean(apiKey));
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing");
  }
  return apiKey;
}

function getClient() {
  const apiKey = assertGeminiConfigured();
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
    console.log("[Gemini] Client initialized");
  }
  return aiClient;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateJSON(systemInstruction, userContent, temperature = 0.2, label = "generateJSON") {
  const ai = getClient();
  let lastError = null;

  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`[Gemini] Sending request: ${label}`, { model });
      const response = await ai.models.generateContent({
        model,
        contents: userContent,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature,
        },
      });

      console.log(`[Gemini] Response OK: ${label} (used ${model})`);
      return parseJsonContent(response.text, label);
    } catch (err) {
      console.warn(`[Gemini] Model ${model} failed for ${label}:`, err.message || err);
      lastError = err;
      // If rate limited (429), wait 2 seconds before trying next model
      if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota")) {
        await sleep(2000);
      }
    }
  }

  console.error(`[Gemini] All models failed for ${label}:`, lastError);
  throw lastError;
}

function parseJsonContent(rawContent, label) {
  if (!rawContent) {
    throw new Error(`Gemini returned empty response for ${label}`);
  }
  let clean = rawContent.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    return JSON.parse(clean);
  } catch (error) {
    console.error(`[Gemini] Invalid JSON from ${label}:`, clean.slice(0, 300));
    throw new Error(`Gemini returned invalid JSON for ${label}`);
  }
}

export async function extractResumeData(text) {
  const systemInstruction = `You are a resume parsing expert. Extract structured data from resume text.
Return valid JSON with keys:
- name (string)
- email (string)
- phone (string)
- skills (array of strings)
- education (array of strings)
- experience (array of strings)
- projects (array of strings)
- certifications (array of strings)
If a field is not found, return empty string or empty array.`;

  const userContent = `Parse this resume:\n\n${text.slice(0, 10000)}`;

  return await generateJSON(systemInstruction, userContent, 0.1, "extractResumeData");
}

export async function analyzeResumeWithAI(text, extractedData) {
  const systemInstruction = `You are an expert resume analyst and career coach. Analyze the resume and return JSON with:
- recommendations: array of 5-8 specific improvement suggestions
- grammarIssues: array of {type, text, suggestion, severity} for grammar/spelling/weak wording issues
- aiImprovements: {summary: improved summary, bulletPoints: array of improved bullet points, projectDescriptions: array of improved project descriptions}
- careerRecommendations: {jobRoles: array of strings, certifications: array of strings, skillsToLearn: array of strings, roadmap: array of career steps}
- sectionScores: {summary: 0-100, experience: 0-100, projects: 0-100, skills: 0-100, education: 0-100}`;

  const userContent = `Analyze this resume:\n\n${text.slice(0, 10000)}\n\nExtracted data: ${JSON.stringify(extractedData)}`;

  return await generateJSON(systemInstruction, userContent, 0.3, "analyzeResumeWithAI");
}

export async function matchJobDescription(resumeText, jobDescription, resumeSkills) {
  const systemInstruction = `You are a job matching expert. Compare resume with job description and return JSON with:
- matchScore: number 0-100
- extractedKeywords: array of important keywords from job description
- matchedSkills: array of skills found in both
- missingSkills: array of required skills missing from resume
- recommendedSkills: array of skills to learn
- suggestions: array of 5 specific suggestions to improve match`;

  const userContent = `Resume:\n${resumeText.slice(0, 5000)}\n\nSkills: ${resumeSkills?.join(", ")}\n\nJob Description:\n${jobDescription.slice(0, 5000)}`;

  return await generateJSON(systemInstruction, userContent, 0.2, "matchJobDescription");
}

export async function generateInterviewQuestions({
  skills = [],
  projects = [],
  targetRole,
  resumeText = "",
  count = 15,
}) {
  const systemInstruction = `Generate exactly ${count} mock interview questions. Return JSON with a "questions" key containing an array of objects:
[{id: string, question: string, type: "technical"|"hr"|"behavioral", category: string}]
Mix technical, HR, and behavioral questions based on the candidate's resume and target role. Ensure each question has a unique "id" string (e.g. "q1", "q2", ...).`;

  const userContent = `Target Role: ${targetRole}
Skills: ${skills.join(", ")}
Projects: ${projects.join("; ")}
Resume Text:
${resumeText.slice(0, 6000)}`;

  const result = await generateJSON(systemInstruction, userContent, 0.7, "generateInterviewQuestions");

  if (!Array.isArray(result.questions) || result.questions.length === 0) {
    throw new Error("Gemini returned no interview questions");
  }

  result.questions = result.questions.map((q, idx) => ({
    ...q,
    id: q.id || `q_${idx + 1}_${Date.now()}`,
  }));

  return result.questions;
}

export async function evaluateInterviewAnswer(question, answer, targetRole) {
  const systemInstruction = `Evaluate the interview answer. Return JSON with:
- score: 0-100 overall (number)
- feedback: detailed constructive feedback (string)
- accuracy: 0-100 (number)
- communication: 0-100 (number)
- confidence: 0-100 (number)
- clarity: 0-100 (number)`;

  const userContent = `Role: ${targetRole}\nQuestion: ${question}\nAnswer: ${answer}`;

  return await generateJSON(systemInstruction, userContent, 0.3, "evaluateInterviewAnswer");
}

export async function generateInterviewFeedback(answers, targetRole) {
  const systemInstruction = `Provide overall interview feedback. Return JSON with:
- score: average score 0-100 (number)
- feedback: comprehensive feedback paragraph with strengths and areas to improve (string)`;

  const userContent = `Role: ${targetRole}\nAnswers evaluated: ${JSON.stringify(answers.slice(0, 10))}`;

  return await generateJSON(systemInstruction, userContent, 0.3, "generateInterviewFeedback");
}
