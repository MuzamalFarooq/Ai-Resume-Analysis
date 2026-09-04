import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ResumeBuilderSession from "@/models/ResumeBuilderSession";
import { requireAuth } from "@/lib/session";
import { generateBuiltResumePdf } from "@/lib/resume-pdf-builder";

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "pdf";

    await connectDB();

    const session = await ResumeBuilderSession.findOne({ _id: id, userId: user.id });
    if (!session) {
      return NextResponse.json({ error: "Resume session not found" }, { status: 404 });
    }

    if (format === "json") {
      return NextResponse.json(session.generatedResume?.resumeData || session.detectedProfile);
    }

    // Generate PDF
    const pdfBuffer = generateBuiltResumePdf(session);
    const candidateName = session.generatedResume?.resumeData?.personal?.fullName || "Resume";
    const cleanFileName = candidateName.replace(/[^a-zA-Z0-9_-]/g, "_");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cleanFileName}_Resume.pdf"`,
      },
    });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[ResumeBuilder] Export error:", error);
    return NextResponse.json({ error: "Failed to export resume" }, { status: 500 });
  }
}
