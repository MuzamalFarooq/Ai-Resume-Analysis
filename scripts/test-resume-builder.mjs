import {
  determineInitialFieldAndCategory,
  generateNextInterviewQuestion,
  updateProfileWithAnswer,
  generateFullAtsResume,
  regenerateResumeSection,
} from "../lib/resume-builder-ai.js";
import { generateBuiltResumePdf } from "../lib/resume-pdf-builder.js";

async function runTests() {
  console.log("=== STARTING AI RESUME BUILDER LOGIC TESTS ===\n");

  // TEST 1: IT / Software Developer
  console.log("--- TEST 1: IT / Software Developer ---");
  const itInit = await determineInitialFieldAndCategory({
    targetRole: "Full Stack Engineer",
    degree: "BS",
    fieldOfStudy: "Computer Science",
    yearsOfExperience: 3,
  });
  console.log("IT Initial Classification:", {
    industry: itInit.industry,
    profession: itInit.profession,
    firstQuestion: itInit.firstQuestion?.question,
  });

  // Simulate Answering Question 1
  let itProfile = {
    industry: itInit.industry,
    profession: itInit.profession,
    specialization: itInit.specialization,
    experienceLevel: itInit.experienceLevel,
    personalInfo: { fullName: "Jane Doe", targetRole: "Full Stack Engineer" },
    experience: [],
    skills: [],
    projects: [],
    education: [],
  };

  itProfile = await updateProfileWithAnswer({
    currentProfile: itProfile,
    question: itInit.firstQuestion,
    answer: "I work with Next.js, React, Node.js, TypeScript, PostgreSQL, Docker, and AWS.",
  });
  console.log("IT Profile after Q1 answer (Skills extracted):", itProfile.skills);

  // Generate Next Question for IT
  const itNextQ = await generateNextInterviewQuestion({
    profile: itProfile,
    history: [{ question: itInit.firstQuestion.question, answer: "Next.js, TypeScript..." }],
    latestAnswer: "I work with Next.js, React, Node.js, TypeScript, PostgreSQL, Docker, and AWS.",
  });
  console.log("IT Next Question:", itNextQ.question?.question);

  // TEST 2: Medical / Healthcare
  console.log("\n--- TEST 2: Medical / Healthcare ---");
  const medInit = await determineInitialFieldAndCategory({
    targetRole: "Cardiologist",
    degree: "MD",
    fieldOfStudy: "Medicine",
    yearsOfExperience: 5,
  });
  console.log("Medical Initial Classification:", {
    industry: medInit.industry,
    profession: medInit.profession,
    firstQuestion: medInit.firstQuestion?.question,
  });

  // TEST 3: Engineering (Civil/Mechanical)
  console.log("\n--- TEST 3: Engineering ---");
  const engInit = await determineInitialFieldAndCategory({
    targetRole: "Mechanical Design Engineer",
    degree: "BS",
    fieldOfStudy: "Mechanical Engineering",
    yearsOfExperience: 4,
  });
  console.log("Engineering Initial Classification:", {
    industry: engInit.industry,
    profession: engInit.profession,
    firstQuestion: engInit.firstQuestion?.question,
  });

  // TEST 4: Full ATS Resume Synthesis & PDF Generation
  console.log("\n--- TEST 4: ATS Resume Synthesis & PDF Generation ---");
  const fullProfile = {
    industry: "Technology",
    profession: "Senior Software Engineer",
    specialization: "Cloud & Distributed Systems",
    experienceLevel: "senior",
    personalInfo: {
      fullName: "Alex Rivera",
      email: "alex.rivera@example.com",
      phone: "+1 (555) 234-5678",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/alexrivera",
      github: "github.com/alexrivera",
      targetRole: "Senior Software Engineer",
    },
    skills: [
      { category: "Languages & Frameworks", items: ["TypeScript", "Next.js", "React", "Node.js", "Go"] },
      { category: "Cloud & Infrastructure", items: ["AWS", "Docker", "Kubernetes", "PostgreSQL", "Redis"] },
    ],
    experience: [
      {
        company: "Stripe Technologies",
        title: "Senior Software Engineer",
        location: "San Francisco, CA",
        startDate: "2022",
        endDate: "Present",
        current: true,
        bullets: [
          "Architected high-throughput payment settlement microservices processing $50M+ daily transactions.",
          "Optimized database query indexing, reducing API p99 latency from 450ms to 85ms.",
          "Mentored 6 junior and mid-level engineers on distributed systems best practices.",
        ],
        technologies: ["Go", "AWS", "PostgreSQL", "Kafka"],
      },
    ],
    projects: [
      {
        name: "OpenTelemetry Metrics Dashboard",
        description: "Built real-time telemetry observation portal monitoring Kubernetes cluster health.",
        role: "Lead Creator",
        technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
        bullets: ["Deployed to 12 production clusters with zero downtime."],
      },
    ],
    education: [
      {
        institution: "University of California, Berkeley",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        location: "Berkeley, CA",
        startDate: "2016",
        endDate: "2020",
        gpa: "3.9",
        highlights: ["Dean's Honor List"],
      },
    ],
    certifications: [
      {
        name: "AWS Certified Solutions Architect - Professional",
        issuer: "Amazon Web Services",
        issueDate: "2023",
      },
    ],
  };

  const resumeResult = await generateFullAtsResume({ profile: fullProfile, template: "modern" });
  console.log("Generated ATS Resume Stats:", {
    atsScore: resumeResult.atsScore,
    sections: resumeResult.sectionOrder,
    summaryExcerpt: resumeResult.resumeData?.summary?.slice(0, 80) + "...",
  });

  // Test Section AI Regeneration
  const regenSummary = await regenerateResumeSection({
    sectionName: "summary",
    currentContent: resumeResult.resumeData?.summary,
    promptInstruction: "Make it more executive-focused and leadership-oriented",
    profile: fullProfile,
  });
  console.log("Regenerated Summary Excerpt:", regenSummary.summary?.slice(0, 80) + "...");

  // Test PDF Buffer Generation across all 4 templates
  for (const tmpl of ["modern", "classic", "minimal", "executive"]) {
    const pdfBuf = generateBuiltResumePdf({
      generatedResume: {
        template: tmpl,
        resumeData: resumeResult.resumeData,
        sectionOrder: resumeResult.sectionOrder,
      },
    });
    console.log(`PDF Generated for template [${tmpl}]: ${pdfBuf.byteLength} bytes.`);
  }

  console.log("\n=== ALL AI RESUME BUILDER LOGIC TESTS PASSED ===");
}

runTests().catch(console.error);
