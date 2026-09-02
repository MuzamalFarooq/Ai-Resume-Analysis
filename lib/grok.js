import OpenAI from "openai";
import { extractSkillsFromText, extractBasicInfo } from "./resume-parser.js";

const MODELS_TO_TRY = [
  process.env.GROK_MODEL,
  "grok-2-latest",
  "grok-2",
  "grok-2-1212",
  "grok-beta",
].filter(Boolean);

let aiClient = null;

export function getGrokApiKey() {
  return process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";
}

export function isGrokConfigured() {
  const apiKey = getGrokApiKey();
  return Boolean(
    apiKey &&
    apiKey !== "your_grok_api_key_here" &&
    !apiKey.includes("your-grok-api-key")
  );
}

export function assertGrokConfigured() {
  const apiKey = getGrokApiKey();
  if (!isGrokConfigured()) {
    throw new Error("GROK_API_KEY missing");
  }
  return apiKey;
}

function getClient() {
  const apiKey = assertGrokConfigured();
  if (!aiClient) {
    aiClient = new OpenAI({
      apiKey,
      baseURL: "https://api.x.ai/v1",
    });
    console.log("[Grok] Client initialized with xAI base URL");
  }
  return aiClient;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateJSON(systemInstruction, userContent, temperature = 0.2, label = "generateJSON") {
  if (!isGrokConfigured()) {
    throw new Error("GROK_API_KEY missing");
  }

  const client = getClient();
  let lastError = null;

  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`[Grok] Sending request: ${label}`, { model });
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userContent },
        ],
        temperature,
        response_format: { type: "json_object" },
      });

      const content = response.choices?.[0]?.message?.content;
      console.log(`[Grok] Response OK: ${label} (used ${model})`);
      return parseJsonContent(content, label);
    } catch (err) {
      console.warn(`[Grok] Model ${model} failed for ${label}:`, err.message || err);
      lastError = err;
      if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("rate")) {
        await sleep(2000);
      }
    }
  }

  console.error(`[Grok] All models failed for ${label}:`, lastError?.message || lastError);
  throw lastError;
}

function parseJsonContent(rawContent, label) {
  if (!rawContent) {
    throw new Error(`Grok returned empty response for ${label}`);
  }
  let clean = rawContent.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    return JSON.parse(clean);
  } catch (error) {
    console.error(`[Grok] Invalid JSON from ${label}:`, clean.slice(0, 300));
    throw new Error(`Grok returned invalid JSON for ${label}`);
  }
}

// Fallback rule-based extraction when Grok API key is not configured or temporary error occurs
function fallbackExtractResumeData(text) {
  const basic = extractBasicInfo(text);
  const skills = extractSkillsFromText(text);

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const experience = [];
  const education = [];
  const projects = [];
  const certifications = [];

  let currentSection = "";
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/^(experience|work experience|employment|work history)/i.test(lower)) {
      currentSection = "exp";
      continue;
    } else if (/^(education|academic background|qualifications)/i.test(lower)) {
      currentSection = "edu";
      continue;
    } else if (/^(projects|personal projects|technical projects)/i.test(lower)) {
      currentSection = "proj";
      continue;
    } else if (/^(certifications|certificates|licenses)/i.test(lower)) {
      currentSection = "cert";
      continue;
    } else if (/^(skills|summary|languages|interests)/i.test(lower)) {
      currentSection = "other";
      continue;
    }

    if (line.length > 5) {
      if (currentSection === "exp" && experience.length < 6) experience.push(line);
      else if (currentSection === "edu" && education.length < 4) education.push(line);
      else if (currentSection === "proj" && projects.length < 5) projects.push(line);
      else if (currentSection === "cert" && certifications.length < 4) certifications.push(line);
    }
  }

  return {
    name: basic.name || "Candidate",
    email: basic.email || "",
    phone: basic.phone || "",
    skills,
    education: education.length > 0 ? education : ["Degree / Academic studies noted in resume"],
    experience: experience.length > 0 ? experience : ["Professional work experience detailed in resume"],
    projects: projects.length > 0 ? projects : ["Portfolio projects / technical contributions"],
    certifications,
  };
}

export async function extractResumeData(text) {
  if (isGrokConfigured()) {
    try {
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
    } catch (err) {
      console.warn("[Grok] AI extract failed, using smart rule-based parser fallback:", err.message);
    }
  }

  return fallbackExtractResumeData(text);
}

// Fallback rule-based AI analysis
function fallbackAnalyzeResume(text, extractedData) {
  const skillsCount = extractedData?.skills?.length || 0;
  const expCount = extractedData?.experience?.length || 0;
  const projCount = extractedData?.projects?.length || 0;
  const eduCount = extractedData?.education?.length || 0;

  const sectionScores = {
    summary: text.toLowerCase().includes("summary") ? 80 : 50,
    experience: Math.min(100, Math.max(50, expCount * 25)),
    projects: Math.min(100, Math.max(50, projCount * 25)),
    skills: Math.min(100, Math.max(45, skillsCount * 8)),
    education: Math.min(100, Math.max(60, eduCount * 30)),
  };

  const recommendations = [
    "Quantify your achievements by adding measurable metrics (e.g., 'improved performance by 30%').",
    "Ensure each bullet point begins with a powerful action verb (e.g., 'Architected', 'Spearheaded', 'Optimized').",
    "Tailor your technical skills section to match the specific keywords in your target job descriptions.",
    "Add direct links to live projects, GitHub repositories, or your online portfolio.",
    "Include a strong, concise professional summary at the top highlighting your core value proposition.",
  ];

  if (skillsCount < 8) {
    recommendations.unshift("Add more industry-relevant technical and soft skills to improve ATS keyword scoring.");
  }

  const aiImprovements = {
    summary:
      "Results-driven professional with a proven track record of delivering scalable solutions, optimizing workflows, and collaborating across multidisciplinary teams to achieve high-impact outcomes.",
    bulletPoints: [
      "Architected and deployed responsive full-stack features, enhancing overall system reliability and user engagement by 25%.",
      "Streamlined data processing pipelines and API integrations, reducing response latency and operational bottlenecks.",
      "Collaborated with cross-functional stakeholders to deliver milestones ahead of schedule with zero critical production bugs.",
    ],
    projectDescriptions: [
      "Full-Stack Web Platform: Engineered a high-performance, accessible web application with secure authentication, database indexing, and responsive UI components.",
    ],
  };

  const careerRecommendations = {
    jobRoles: [
      "Full Stack Developer",
      "Frontend Engineer",
      "Software Engineer",
      "Backend Developer",
    ],
    certifications: [
      "AWS Certified Solutions Architect / Cloud Practitioner",
      "Meta Front-End / Back-End Professional Certificate",
      "Certified Kubernetes Application Developer (CKAD)",
    ],
    skillsToLearn: [
      "System Design & Microservices",
      "Cloud Infrastructure (AWS / Azure)",
      "CI/CD Pipelines & Docker",
      "Automated Testing (Jest / Playwright)",
    ],
    roadmap: [
      "Step 1: Optimize resume keywords and bullet point metrics for ATS scanners.",
      "Step 2: Build and deploy 2 showcase full-stack projects with live demos and clean GitHub repositories.",
      "Step 3: Practice mock interview questions across technical, behavioral, and system design topics.",
      "Step 4: Actively network on LinkedIn and apply to target roles with tailored cover letters.",
    ],
  };

  return {
    recommendations,
    grammarIssues: [],
    aiImprovements,
    careerRecommendations,
    sectionScores,
  };
}

export async function analyzeResumeWithAI(text, extractedData) {
  if (isGrokConfigured()) {
    try {
      const systemInstruction = `You are an expert resume analyst and career coach. Analyze the resume and return JSON with:
- recommendations: array of 5-8 specific improvement suggestions
- grammarIssues: array of {type, text, suggestion, severity} for grammar/spelling/weak wording issues
- aiImprovements: {summary: improved summary, bulletPoints: array of improved bullet points, projectDescriptions: array of improved project descriptions}
- careerRecommendations: {jobRoles: array of strings, certifications: array of strings, skillsToLearn: array of strings, roadmap: array of career steps}
- sectionScores: {summary: 0-100, experience: 0-100, projects: 0-100, skills: 0-100, education: 0-100}`;

      const userContent = `Analyze this resume:\n\n${text.slice(0, 10000)}\n\nExtracted data: ${JSON.stringify(extractedData)}`;
      return await generateJSON(systemInstruction, userContent, 0.3, "analyzeResumeWithAI");
    } catch (err) {
      console.warn("[Grok] AI analysis failed, using fallback analysis:", err.message);
    }
  }

  return fallbackAnalyzeResume(text, extractedData);
}

export async function matchJobDescription(resumeText, jobDescription, resumeSkills = []) {
  if (isGrokConfigured()) {
    try {
      const systemInstruction = `You are a job matching expert. Compare resume with job description and return JSON with:
- matchScore: number 0-100
- extractedKeywords: array of important keywords from job description
- matchedSkills: array of skills found in both
- missingSkills: array of required skills missing from resume
- recommendedSkills: array of skills to learn
- suggestions: array of 5 specific suggestions to improve match`;

      const userContent = `Resume:\n${resumeText.slice(0, 5000)}\n\nSkills: ${resumeSkills?.join(", ")}\n\nJob Description:\n${jobDescription.slice(0, 5000)}`;
      return await generateJSON(systemInstruction, userContent, 0.2, "matchJobDescription");
    } catch (err) {
      console.warn("[Grok] AI job match failed, using fallback job matcher:", err.message);
    }
  }

  // Fallback rule-based matching
  const jobSkills = extractSkillsFromText(jobDescription);
  const matchedSkills = jobSkills.filter((s) =>
    resumeSkills.some((rs) => rs.toLowerCase() === s.toLowerCase())
  );
  const missingSkills = jobSkills.filter(
    (s) => !resumeSkills.some((rs) => rs.toLowerCase() === s.toLowerCase())
  );

  const matchScore = jobSkills.length > 0
    ? Math.round((matchedSkills.length / jobSkills.length) * 100)
    : 70;

  return {
    matchScore: Math.max(30, Math.min(100, matchScore)),
    extractedKeywords: jobSkills.slice(0, 10),
    matchedSkills,
    missingSkills,
    recommendedSkills: missingSkills.slice(0, 5),
    suggestions: [
      `Incorporate missing target keywords like ${missingSkills.slice(0, 3).join(", ") || "relevant technical skills"} into your experience section.`,
      "Align your project descriptions directly with the key requirements stated in the job post.",
      "Highlight demonstrated results and metrics in areas prioritized by the employer.",
      "Ensure your summary statement explicitly names the target role title.",
      "Review the job description's required years of experience and align your timeline accordingly.",
    ],
  };
}

export async function generateInterviewQuestions({
  skills = [],
  projects = [],
  targetRole = "Software Engineer",
  resumeText = "",
  count = 15,
}) {
  if (isGrokConfigured()) {
    try {
      const systemInstruction = `Generate exactly ${count} mock interview questions. Return JSON with a "questions" key containing an array of objects:
[{id: string, question: string, type: "technical"|"hr"|"behavioral", category: string}]
Mix technical, HR, and behavioral questions based on the candidate's resume and target role. Ensure each question has a unique "id" string (e.g. "q1", "q2", ...).`;

      const userContent = `Target Role: ${targetRole}
Skills: ${skills.join(", ")}
Projects: ${projects.join("; ")}
Resume Text:
${resumeText.slice(0, 6000)}`;

      const result = await generateJSON(systemInstruction, userContent, 0.7, "generateInterviewQuestions");
      if (Array.isArray(result?.questions) && result.questions.length > 0) {
        return result.questions.map((q, idx) => ({
          ...q,
          id: q.id || `q_${idx + 1}_${Date.now()}`,
        }));
      }
    } catch (err) {
      console.warn("[Grok] AI interview question generation failed, using fallback questions:", err.message);
    }
  }

  // Fallback interview questions
  const baseQuestions = [
    { id: "q1", question: `Can you walk me through your background and why you are interested in this ${targetRole} position?`, type: "hr", category: "Introduction" },
    { id: "q2", question: `What are your strongest technical skills, and how have you applied them in recent projects?`, type: "technical", category: "Technical Skills" },
    { id: "q3", question: `Describe a challenging bug or technical roadblock you faced. How did you diagnose and resolve it?`, type: "technical", category: "Problem Solving" },
    { id: "q4", question: `Tell me about a time you had a disagreement with a team member or stakeholder. How did you handle it?`, type: "behavioral", category: "Collaboration" },
    { id: "q5", question: `How do you ensure the code you write is scalable, clean, and well-tested?`, type: "technical", category: "Best Practices" },
    { id: "q6", question: `Describe a project from your resume that you are most proud of. What was your specific contribution?`, type: "technical", category: "Projects" },
    { id: "q7", question: `Tell me about a time you had to learn a new technology or framework under a tight deadline.`, type: "behavioral", category: "Adaptability" },
    { id: "q8", question: `How do you prioritize competing tasks and deadlines when working on multiple features?`, type: "behavioral", category: "Time Management" },
    { id: "q9", question: `Explain how you design RESTful or GraphQL APIs for high performance and security.`, type: "technical", category: "System Design" },
    { id: "q10", question: `Where do you see your career growth over the next 2 to 3 years in this field?`, type: "hr", category: "Career Goals" },
    { id: "q11", question: `How do you handle receiving critical code review feedback from peers or leads?`, type: "behavioral", category: "Growth Mindset" },
    { id: "q12", question: `What strategies do you use for debugging performance bottlenecks in web applications?`, type: "technical", category: "Performance" },
    { id: "q13", question: `Describe a situation where a project requirement changed midway. How did you adapt?`, type: "behavioral", category: "Flexibility" },
    { id: "q14", question: `How do you stay updated with emerging web technologies and industry standards?`, type: "hr", category: "Continuous Learning" },
    { id: "q15", question: `Why should our team hire you for this ${targetRole} role over other candidates?`, type: "hr", category: "Closing" },
  ];

  return baseQuestions.slice(0, count);
}

export async function evaluateInterviewAnswer(question, answer, targetRole) {
  if (isGrokConfigured()) {
    try {
      const systemInstruction = `Evaluate the interview answer. Return JSON with:
- score: 0-100 overall (number)
- feedback: detailed constructive feedback (string)
- accuracy: 0-100 (number)
- communication: 0-100 (number)
- confidence: 0-100 (number)
- clarity: 0-100 (number)`;

      const userContent = `Role: ${targetRole}\nQuestion: ${question}\nAnswer: ${answer}`;
      return await generateJSON(systemInstruction, userContent, 0.3, "evaluateInterviewAnswer");
    } catch (err) {
      console.warn("[Grok] AI answer evaluation failed, using fallback evaluator:", err.message);
    }
  }

  // Fallback evaluator
  const wordCount = (answer || "").trim().split(/\s+/).filter(Boolean).length;
  let score = 70;
  if (wordCount < 10) score = 40;
  else if (wordCount >= 30 && wordCount <= 150) score = 85;
  else if (wordCount > 150) score = 80;

  return {
    score,
    accuracy: Math.min(100, score + 5),
    communication: Math.min(100, score),
    confidence: Math.min(100, score - 5),
    clarity: Math.min(100, score),
    feedback:
      wordCount < 20
        ? "Your answer is quite concise. Try using the STAR method (Situation, Task, Action, Result) to provide concrete examples and quantify your achievements."
        : "Good response! You clearly addressed the prompt. To make it even stronger, emphasize specific metrics, technologies used, and lessons learned.",
  };
}

export async function generateInterviewFeedback(answers = [], targetRole = "Software Engineer") {
  if (isGrokConfigured()) {
    try {
      const systemInstruction = `Provide overall interview feedback. Return JSON with:
- score: average score 0-100 (number)
- feedback: comprehensive feedback paragraph with strengths and areas to improve (string)`;

      const userContent = `Role: ${targetRole}\nAnswers evaluated: ${JSON.stringify(answers.slice(0, 10))}`;
      return await generateJSON(systemInstruction, userContent, 0.3, "generateInterviewFeedback");
    } catch (err) {
      console.warn("[Grok] AI interview feedback summary failed, using fallback:", err.message);
    }
  }

  const scores = answers.map((a) => a.score || 70);
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75;

  return {
    score: avg,
    feedback: `You demonstrated solid foundational understanding and communication for the ${targetRole} role. Continuing to practice structured answers using the STAR method and highlighting quantifiable impact will help you stand out even more in live interviews.`,
  };
}
