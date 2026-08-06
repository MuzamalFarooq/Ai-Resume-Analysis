// Re-exporting from Gemini API service for backward compatibility across the application

export {
  assertGeminiConfigured as assertOpenAIConfigured,
  extractResumeData,
  analyzeResumeWithAI,
  matchJobDescription,
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  generateInterviewFeedback,
} from "./gemini.js";
