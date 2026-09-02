// Re-exporting from Grok AI service for backward compatibility across the application

export {
  assertGrokConfigured as assertOpenAIConfigured,
  assertGrokConfigured as assertGeminiConfigured,
  getGrokApiKey as getOpenAIApiKey,
  extractResumeData,
  analyzeResumeWithAI,
  matchJobDescription,
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  generateInterviewFeedback,
} from "./grok.js";
