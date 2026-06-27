import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Resume from "@/models/Resume";
import { requireAuth } from "@/lib/session";

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await connectDB();
    const resume = await Resume.findOne({ _id: id, userId: user.id });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({ resume });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get resume error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await connectDB();
    const resume = await Resume.findOneAndDelete({ _id: id, userId: user.id });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Resume deleted" });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Delete resume error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
