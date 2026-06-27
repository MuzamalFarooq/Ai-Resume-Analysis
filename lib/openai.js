import OpenAI from "openai";

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function extractResumeData(text) {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
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
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function analyzeResumeWithAI(text, extractedData) {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
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
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function matchJobDescription(resumeText, jobDescription, resumeSkills) {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
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
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function generateInterviewQuestions(skills, projects, targetRole, count = 15) {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Generate ${count} mock interview questions. Return JSON with questions array:
[{id: unique string, question: string, type: "technical"|"hr"|"behavioral", category: string}]
Mix technical, HR, and behavioral questions based on the candidate's profile.`,
      },
      {
        role: "user",
        content: `Target Role: ${targetRole}\nSkills: ${skills?.join(", ")}\nProjects: ${projects?.join("; ")}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const result = JSON.parse(response.choices[0].message.content);
  return result.questions || [];
}

export async function evaluateInterviewAnswer(question, answer, targetRole) {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
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
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function generateInterviewFeedback(answers, targetRole) {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
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
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content);
}
