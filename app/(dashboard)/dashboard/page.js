import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Resume from "@/models/Resume";
import InterviewSession from "@/models/InterviewSession";
import JobDescription from "@/models/JobDescription";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBarChart, TrendLineChart } from "@/components/charts/charts";
import Link from "next/link";
import { formatDate, getScoreColor } from "@/utils/cn";
import {
  FileText,
  Target,
  MessageSquare,
  TrendingUp,
  Upload,
  ArrowRight,
} from "lucide-react";

export const metadata = { title: "Dashboard - ResumeAI" };

async function getDashboardData(userId) {
  await connectDB();

  const [resumes, interviews, jobMatches] = await Promise.all([
    Resume.find({ userId, status: "completed" }).sort({ createdAt: -1 }).limit(10),
    InterviewSession.find({ userId, status: "completed" }).sort({ createdAt: -1 }).limit(5),
    JobDescription.find({ userId }).sort({ createdAt: -1 }).limit(5),
  ]);

  const avgAts = resumes.length
    ? Math.round(resumes.reduce((s, r) => s + r.atsScore, 0) / resumes.length)
    : 0;

  const avgInterview = interviews.length
    ? Math.round(interviews.reduce((s, i) => s + i.score, 0) / interviews.length)
    : 0;

  const chartData = resumes.slice(0, 6).reverse().map((r) => ({
    name: r.fileName?.slice(0, 12) || "Resume",
    score: r.atsScore,
  }));

  const trendData = resumes.slice(0, 6).reverse().map((r) => ({
    date: formatDate(r.createdAt),
    atsScore: r.atsScore,
    grammarScore: r.grammarScore,
  }));

  return { resumes, interviews, jobMatches, avgAts, avgInterview, chartData, trendData };
}

export default async function DashboardPage() {
  const session = await auth();
  const { resumes, interviews, jobMatches, avgAts, avgInterview, chartData, trendData } =
    await getDashboardData(session.user.id);

  const stats = [
    { label: "Resumes Analyzed", value: resumes.length, icon: FileText, color: "text-blue-500" },
    { label: "Avg ATS Score", value: `${avgAts}%`, icon: Target, color: "text-green-500" },
    { label: "Interviews Done", value: interviews.length, icon: MessageSquare, color: "text-purple-500" },
    { label: "Avg Interview Score", value: `${avgInterview}%`, icon: TrendingUp, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your resume analysis and interview progress</p>
        </div>
        <Link href="/upload">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Resume
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`rounded-full bg-muted p-3 ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ATS Scores</CardTitle>
            <CardDescription>Score comparison across resumes</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ScoreBarChart data={chartData} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Upload a resume to see scores</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress Trends</CardTitle>
            <CardDescription>ATS and grammar score over time</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <TrendLineChart data={trendData} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Track your improvement over time</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Resumes</CardTitle>
              <CardDescription>Latest analyzed resumes</CardDescription>
            </div>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {resumes.length > 0 ? (
              <div className="space-y-3">
                {resumes.slice(0, 5).map((resume) => (
                  <Link
                    key={resume._id.toString()}
                    href={`/analysis/${resume._id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{resume.fileName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(resume.createdAt)}</p>
                      </div>
                    </div>
                    <Badge variant={resume.atsScore >= 70 ? "success" : "warning"}>
                      {resume.atsScore}%
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No resumes yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Interviews</CardTitle>
            <CardDescription>Latest mock interview sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {interviews.length > 0 ? (
              <div className="space-y-3">
                {interviews.map((interview) => (
                  <Link
                    key={interview._id.toString()}
                    href={`/interview-result/${interview._id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{interview.targetRole}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(interview.createdAt)}</p>
                    </div>
                    <span className={`font-bold ${getScoreColor(interview.score)}`}>
                      {interview.score}%
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-3">No interviews yet</p>
                <Link href="/mock-interview">
                  <Button variant="outline" size="sm">Start Mock Interview</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
