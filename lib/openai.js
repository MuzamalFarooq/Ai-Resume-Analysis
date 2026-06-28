import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

let client = null;

export function assertOpenAIConfigured() {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  console.log("[OpenAI] OPENAI_API_KEY present:", hasKey);
  if (!hasKey) {
    throw new Error("OPENAI_API_KEY missing");
  }
}

function getClient() {
  assertOpenAIConfigured();
  if (!client) {
    const orgId = process.env.OPENAI_ORG_ID?.trim();
    if (orgId && (orgId.includes("...") || !/^org-[a-zA-Z0-9]+$/.test(orgId))) {
      console.warn("[OpenAI] Ignoring invalid OPENAI_ORG_ID — using API key only");
      delete process.env.OPENAI_ORG_ID;
    }

    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("[OpenAI] Client initialized");
  }
  return client;
}

async function createChatCompletion(messages, options = {}, label = "chat") {
  const openai = getClient();
  console.log(`[OpenAI] Sending request: ${label}`, { model: MODEL });

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      ...options,
    });

    console.log(`[OpenAI] Response OK: ${label}`, {
      id: response.id,
      model: response.model,
      finishReason: response.choices[0]?.finish_reason,
    });

    return response;
  } catch (error) {
    console.error(`[OpenAI] Request failed: ${label}`, {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
    });
    throw error;
  }
}

function parseJsonContent(content, label) {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(`[OpenAI] Invalid JSON from ${label}:`, content?.slice?.(0, 200));
    throw new Error(`OpenAI returned invalid JSON for ${label}`);
  }
}

export async function extractResumeData(text) {
  const response = await createChatCompletion(
    [
      {
        role: "system",
        content: `You are a resume parsing expert. Extract structured data from resume text.
Return valid JSON with: name, email, phone, skills (array), education (array of strings),
experience (array of strings), projects (array of strings), certifications (array of strings).
If a field is not found, use empty string or empty array.`,
      },
      {
        role: "user",
        content: `Parse this resume:\n\n${text.slice(0, 8000)}`,
      },
    ],
    { response_format: { type: "json_object" }, temperature: 0.1 },
    "extractResumeData"
  );

  return parseJsonContent(response.choices[0].message.content, "extractResumeData");
}

export async function analyzeResumeWithAI(text, extractedData) {
  const response = await createChatCompletion(
    [
      {
        role: "system",
        content: `You are an expert resume analyst and career coach. Analyze the resume and return JSON with:
- recommendations: array of 5-8 specific improvement suggestions
- grammarIssues: array of {type, text, suggestion, severity} for grammar/spelling/weak wording issues
- aiImprovements: {summary: improved summary, bulletPoints: array of improved bullet points, projectDescriptions: array of improved project descriptions}
- careerRecommendations: {jobRoles: array, certifications: array, skillsToLearn: array, roadmap: array of career steps}
- sectionScores: {summary: 0-100, experience: 0-100, projects: 0-100, skills: 0-100, education: 0-100}`,
      },
      {
        role: "user",
        content: `Analyze this resume:\n\n${text.slice(0, 8000)}\n\nExtracted data: ${JSON.stringify(extractedData)}`,
      },
    ],
    { response_format: { type: "json_object" }, temperature: 0.3 },
    "analyzeResumeWithAI"
  );

  return parseJsonContent(response.choices[0].message.content, "analyzeResumeWithAI");
}

export async function matchJobDescription(resumeText, jobDescription, resumeSkills) {
  const response = await createChatCompletion(
    [
      {
        role: "system",
        content: `You are a job matching expert. Compare resume with job description and return JSON with:
- matchScore: number 0-100
- extractedKeywords: array of important keywords from job description
- matchedSkills: array of skills found in both
- missingSkills: array of required skills missing from resume
- recommendedSkills: array of skills to learn
- suggestions: array of 5 specific suggestions to improve match`,
      },
      {
        role: "user",
        content: `Resume:\n${resumeText.slice(0, 4000)}\n\nSkills: ${resumeSkills?.join(", ")}\n\nJob Description:\n${jobDescription.slice(0, 4000)}`,
      },
    ],
    { response_format: { type: "json_object" }, temperature: 0.2 },
    "matchJobDescription"
  );

  return parseJsonContent(response.choices[0].message.content, "matchJobDescription");
}

export async function generateInterviewQuestions({
  skills = [],
  projects = [],
  targetRole,
  resumeText = "",
  count = 15,
}) {
  const response = await createChatCompletion(
    [
      {
        role: "system",
        content: `Generate exactly ${count} mock interview questions. Return JSON with questions array:
[{id: unique string, question: string, type: "technical"|"hr"|"behavioral", category: string}]
Mix technical, HR, and behavioral questions based on the candidate's resume and target role.`,
      },
      {
        role: "user",
        content: `Target Role: ${targetRole}
Skills: ${skills.join(", ")}
Projects: ${projects.join("; ")}
Resume Text:
${resumeText.slice(0, 6000)}`,
      },
    ],
    { response_format: { type: "json_object" }, temperature: 0.7 },
    "generateInterviewQuestions"
  );

  const result = parseJsonContent(
    response.choices[0].message.content,
    "generateInterviewQuestions"
  );

  if (!Array.isArray(result.questions) || result.questions.length === 0) {
    throw new Error("OpenAI returned no interview questions");
  }

  return result.questions;
}

export async function evaluateInterviewAnswer(question, answer, targetRole) {
  const response = await createChatCompletion(
    [
      {
        role: "system",
        content: `Evaluate the interview answer. Return JSON with:
- score: 0-100 overall
- feedback: detailed constructive feedback
- accuracy: 0-100
- communication: 0-100
- confidence: 0-100
- clarity: 0-100`,
      },
      {
        role: "user",
        content: `Role: ${targetRole}\nQuestion: ${question}\nAnswer: ${answer}`,
      },
    ],
    { response_format: { type: "json_object" }, temperature: 0.3 },
    "evaluateInterviewAnswer"
  );

  return parseJsonContent(response.choices[0].message.content, "evaluateInterviewAnswer");
}

export async function generateInterviewFeedback(answers, targetRole) {
  const response = await createChatCompletion(
    [
      {
        role: "system",
        content: `Provide overall interview feedback. Return JSON with:
- score: average score 0-100
- feedback: comprehensive feedback paragraph with strengths and areas to improve`,
      },
      {
        role: "user",
        content: `Role: ${targetRole}\nAnswers evaluated: ${JSON.stringify(answers.slice(0, 10))}`,
      },
    ],
    { response_format: { type: "json_object" }, temperature: 0.3 },
    "generateInterviewFeedback"
  );

  return parseJsonContent(response.choices[0].message.content, "generateInterviewFeedback");
}
