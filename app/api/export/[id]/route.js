import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Resume from "@/models/Resume";
import InterviewSession from "@/models/InterviewSession";
import { requireAuth } from "@/lib/session";
import { generateResumeReport, generateInterviewReport } from "@/lib/pdf-export";

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "resume";

    await connectDB();

    let pdfBuffer;

    if (type === "interview") {
      const session = await InterviewSession.findOne({ _id: id, userId: user.id });
      if (!session) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      pdfBuffer = generateInterviewReport(session.toObject());
    } else {
      const resume = await Resume.findOne({ _id: id, userId: user.id });
      if (!resume) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      pdfBuffer = generateResumeReport(resume.toObject());
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${type}-report-${id}.pdf"`,
      },
    });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
