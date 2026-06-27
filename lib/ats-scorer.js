const ATS_KEYWORDS = [
  "experience", "skills", "education", "projects", "certifications",
  "achievements", "summary", "objective", "work history", "employment",
  "bachelor", "master", "degree", "university", "college",
  "managed", "developed", "implemented", "led", "created", "designed",
  "improved", "increased", "reduced", "achieved", "delivered",
];

export function calculateATSScore(text, extractedData) {
  let score = 0;
  const lowerText = text.toLowerCase();

  // Keyword optimization (25 points)
  const foundKeywords = ATS_KEYWORDS.filter((kw) => lowerText.includes(kw));
  score += Math.min(25, (foundKeywords.length / ATS_KEYWORDS.length) * 25);

  // Completeness (25 points)
  let completeness = 0;
  if (extractedData?.name) completeness += 5;
  if (extractedData?.email) completeness += 5;
  if (extractedData?.phone) completeness += 3;
  if (extractedData?.skills?.length > 0) completeness += 4;
  if (extractedData?.experience?.length > 0) completeness += 4;
  if (extractedData?.education?.length > 0) completeness += 4;
  if (extractedData?.projects?.length > 0) completeness += 3;
  if (extractedData?.certifications?.length > 0) completeness += 2;
  score += completeness;

  // Formatting (25 points) - checked separately but contribute here
  const formattingScore = analyzeFormatting(text);
  score += (formattingScore / 100) * 25;

  // Readability (25 points)
  const readabilityScore = calculateReadability(text);
  score += (readabilityScore / 100) * 25;

  return Math.round(Math.min(100, score));
}

export function calculateReadability(text) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;

  let score = 70;

  // Ideal: 10-20 words per sentence
  if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 25) score += 15;
  else if (avgWordsPerSentence > 30) score -= 10;

  // Check for bullet points (good for resumes)
  const bulletCount = (text.match(/[•\-\*]\s/g) || []).length;
  if (bulletCount >= 3) score += 10;

  // Penalize very short resumes
  if (words.length < 100) score -= 20;
  if (words.length > 200) score += 5;

  return Math.max(0, Math.min(100, score));
}

export function analyzeFormatting(text) {
  let score = 70;
  const lines = text.split("\n");

  // Check for consistent line lengths (not too varied)
  const lineLengths = lines.map((l) => l.trim().length).filter((l) => l > 0);
  if (lineLengths.length > 0) {
    const avgLength = lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length;
    const variance =
      lineLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) /
      lineLengths.length;
    if (variance < 5000) score += 10;
  }

  // Check for section headers
  const headerPatterns = /^(experience|education|skills|projects|summary|certifications|work history)/i;
  const headers = lines.filter((l) => headerPatterns.test(l.trim()));
  if (headers.length >= 3) score += 15;

  // Penalize excessive blank lines
  const blankLines = lines.filter((l) => l.trim() === "").length;
  if (blankLines > lines.length * 0.3) score -= 10;

  // Check for contact info at top
  const topSection = lines.slice(0, 5).join(" ");
  if (/[\w.-]+@[\w.-]+\.\w+/.test(topSection)) score += 5;

  return Math.max(0, Math.min(100, score));
}

export function analyzeGrammar(text) {
  const issues = [];
  let score = 100;

  // Passive voice detection
  const passivePatterns = /\b(was|were|been|being|is|are|am)\s+\w+ed\b/gi;
  const passiveMatches = text.match(passivePatterns) || [];
  passiveMatches.slice(0, 5).forEach((match) => {
    issues.push({
      type: "passive_voice",
      text: match,
      suggestion: "Consider using active voice for stronger impact",
      severity: "medium",
    });
    score -= 3;
  });

  // Weak words
  const weakWords = ["very", "really", "just", "basically", "actually", "literally"];
  weakWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = text.match(regex) || [];
    if (matches.length > 2) {
      issues.push({
        type: "weak_wording",
        text: `"${word}" used ${matches.length} times`,
        suggestion: `Reduce usage of "${word}" - use stronger, specific language`,
        severity: "low",
      });
      score -= 2;
    }
  });

  // Repeated words
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = {};
  words.forEach((w) => {
    if (w.length > 4) wordCount[w] = (wordCount[w] || 0) + 1;
  });
  Object.entries(wordCount)
    .filter(([, count]) => count > 5)
    .slice(0, 3)
    .forEach(([word, count]) => {
      issues.push({
        type: "repeated_word",
        text: `"${word}" repeated ${count} times`,
        suggestion: "Use synonyms or restructure sentences",
        severity: "low",
      });
      score -= 2;
    });

  // Missing action verbs in bullet points
  const actionVerbs = ["developed", "managed", "created", "led", "implemented", "designed", "improved"];
  const bulletLines = text.split("\n").filter((l) => /^[\s•\-\*]/.test(l));
  const weakBullets = bulletLines.filter(
    (line) => !actionVerbs.some((v) => line.toLowerCase().includes(v))
  );
  if (weakBullets.length > bulletLines.length * 0.5 && bulletLines.length > 0) {
    issues.push({
      type: "weak_bullets",
      text: "Many bullet points lack strong action verbs",
      suggestion: "Start bullet points with action verbs like Developed, Led, Implemented",
      severity: "high",
    });
    score -= 10;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
  };
}

export function getFormattingIssues(text) {
  const issues = [];
  const lines = text.split("\n");

  const blankRatio = lines.filter((l) => l.trim() === "").length / lines.length;
  if (blankRatio > 0.35) {
    issues.push({
      category: "spacing",
      issue: "Excessive blank lines detected",
      suggestion: "Reduce whitespace to maintain a compact, professional layout",
    });
  }

  const headerPatterns = /^(experience|education|skills|projects|summary)/i;
  const headers = lines.filter((l) => headerPatterns.test(l.trim()));
  if (headers.length < 2) {
    issues.push({
      category: "layout",
      issue: "Missing clear section headers",
      suggestion: "Add clear section headers like Experience, Skills, Education",
    });
  }

  if (text.length < 200) {
    issues.push({
      category: "completeness",
      issue: "Resume content appears too short",
      suggestion: "Add more detail to experience and projects sections",
    });
  }

  const longLines = lines.filter((l) => l.length > 120);
  if (longLines.length > 3) {
    issues.push({
      category: "readability",
      issue: "Long lines without breaks",
      suggestion: "Break long paragraphs into bullet points",
    });
  }

  return issues;
}

export function calculateSectionScores(text, extractedData) {
  const lowerText = text.toLowerCase();

  return {
    summary: lowerText.includes("summary") || lowerText.includes("objective") ? 75 : 40,
    experience: Math.min(100, (extractedData?.experience?.length || 0) * 25),
    projects: Math.min(100, (extractedData?.projects?.length || 0) * 30),
    skills: Math.min(100, (extractedData?.skills?.length || 0) * 8),
    education: Math.min(100, (extractedData?.education?.length || 0) * 35),
  };
}
