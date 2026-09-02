// Re-exporting from Grok AI service for backward compatibility across the application

export {
  assertGrokConfigured as assertGeminiConfigured,
  assertGrokConfigured as assertOpenAIConfigured,
  getGrokApiKey as getGeminiApiKey,
  extractResumeData,
  analyzeResumeWithAI,
  matchJobDescription,
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  generateInterviewFeedback,
} from "./grok.js";
