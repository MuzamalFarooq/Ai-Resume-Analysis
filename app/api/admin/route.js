import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Resume from "@/models/Resume";
import InterviewSession from "@/models/InterviewSession";
import JobDescription from "@/models/JobDescription";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const [
      totalUsers,
      totalResumes,
      completedResumes,
      totalInterviews,
      completedInterviews,
      totalJobMatches,
      recentUsers,
      recentResumes,
    ] = await Promise.all([
      User.countDocuments(),
      Resume.countDocuments(),
      Resume.countDocuments({ status: "completed" }),
      InterviewSession.countDocuments(),
      InterviewSession.countDocuments({ status: "completed" }),
      JobDescription.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt"),
      Resume.find({ status: "completed" }).sort({ createdAt: -1 }).limit(5).select("fileName atsScore userId createdAt"),
    ]);

    const avgAtsScore = await Resume.aggregate([
      { $match: { status: "completed", atsScore: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$atsScore" } } },
    ]);

    const avgInterviewScore = await InterviewSession.aggregate([
      { $match: { status: "completed", score: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$score" } } },
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const resumesByMonth = await Resume.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalResumes,
        completedResumes,
        totalInterviews,
        completedInterviews,
        totalJobMatches,
        avgAtsScore: Math.round(avgAtsScore[0]?.avg || 0),
        avgInterviewScore: Math.round(avgInterviewScore[0]?.avg || 0),
      },
      usersByRole,
      resumesByMonth,
      recentUsers,
      recentResumes,
    });
  } catch (error) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
