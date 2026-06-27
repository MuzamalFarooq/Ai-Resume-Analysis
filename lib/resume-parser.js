import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function parseResumeFile(buffer, fileType) {
  let text = "";

  if (fileType === "application/pdf" || fileType === "pdf") {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    text = result.text;
    await parser.destroy();
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "docx"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (fileType === "application/msword" || fileType === "doc") {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    throw new Error("Unsupported file type. Please upload PDF or DOCX.");
  }

  if (!text || text.trim().length < 50) {
    throw new Error("Could not extract sufficient text from the file.");
  }

  return text.trim();
}

export function extractBasicInfo(text) {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const lines = text.split("\n").filter((l) => l.trim());
  const name = lines[0]?.trim() || "";

  return {
    name,
    email: emailMatch?.[0] || "",
    phone: phoneMatch?.[0] || "",
  };
}

export function extractSkillsFromText(text) {
  const commonSkills = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Ruby", "Go", "Rust", "Swift",
    "React", "Next.js", "Vue", "Angular", "Node.js", "Express", "Django", "Flask", "Spring",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "Git", "CI/CD", "Agile", "Scrum", "REST", "GraphQL", "HTML", "CSS", "Tailwind",
    "Machine Learning", "AI", "Data Analysis", "SQL", "NoSQL", "Linux", "DevOps",
    "Communication", "Leadership", "Problem Solving", "Teamwork", "Project Management",
  ];

  const lowerText = text.toLowerCase();
  return commonSkills.filter((skill) =>
    lowerText.includes(skill.toLowerCase())
  );
}
