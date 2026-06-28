import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Resume from "@/models/Resume";
import { requireAuth } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
      Resume.find({ userId: user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-parsedText"),
      Resume.countDocuments({ userId: user.id }),
    ]);

    return NextResponse.json({ resumes, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get resumes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (user.role !== "user") {
      const limit = rateLimit(`upload-${user.id}`, 10, 3600000);
      if (!limit.success) {
        return NextResponse.json({ error: "Upload limit reached" }, { status: 429 });
      }
    }

    const body = await request.json();
    const { fileUrl, fileName, fileType } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: "File URL is required" }, { status: 400 });
    }

    await connectDB();

    const resume = await Resume.create({
      userId: user.id,
      fileUrl,
      fileName: fileName || "resume",
      fileType: fileType || "pdf",
      status: "pending",
    });

    // Trigger analysis in background
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fetch(`${baseUrl}/api/analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId: resume._id.toString() }),
    }).catch(console.error);

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create resume error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
