import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ResumeBuilderSession from "@/models/ResumeBuilderSession";
import { requireAuth } from "@/lib/session";
import { determineInitialFieldAndCategory } from "@/lib/resume-builder-ai";

export async function POST(request) {
  try {
    const user = await requireAuth();
    await connectDB();

    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      location,
      linkedin,
      github,
      portfolio,
      targetRole,
      degree,
      fieldOfStudy,
      yearsOfExperience,
    } = body;

    // AI Classification & First Question
    const classification = await determineInitialFieldAndCategory({
      targetRole: targetRole || "Software Developer",
      degree,
      fieldOfStudy,
      yearsOfExperience: Number(yearsOfExperience) || 0,
    });

    const initialProfile = {
      industry: classification.industry || "Technology",
      profession: classification.profession || targetRole || "Professional",
      specialization: classification.specialization || fieldOfStudy || "",
      experienceLevel: classification.experienceLevel || "mid",
      personalInfo: {
        fullName: fullName || user.name || "",
        email: email || user.email || "",
        phone: phone || "",
        location: location || "",
        linkedin: linkedin || "",
        github: github || "",
        portfolio: portfolio || "",
        targetRole: targetRole || classification.profession || "",
        summary: "",
      },
      education: degree
        ? [
            {
              institution: "",
              degree,
              fieldOfStudy: fieldOfStudy || "",
              location: "",
              startDate: "",
              endDate: "",
              current: false,
              gpa: "",
              highlights: [],
            },
          ]
        : [],
      experience: [],
      projects: [],
      skills: [],
      certifications: [],
      achievements: [],
      services: [],
      publications: [],
      languages: [{ language: "English", proficiency: "Fluent" }],
    };

    const session = await ResumeBuilderSession.create({
      userId: user.id,
      title: `${targetRole || classification.profession || "AI"} Resume (${new Date().toLocaleDateString()})`,
      status: "interviewing",
      detectedProfile: initialProfile,
      currentQuestion: classification.firstQuestion,
      questionHistory: [],
      completenessScore: 15,
      missingSections: ["experience", "projects", "skills"],
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[ResumeBuilder] Start session error:", error);
    return NextResponse.json({ error: "Failed to initialize interview session" }, { status: 500 });
  }
}
