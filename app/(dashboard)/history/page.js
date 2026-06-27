import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Resume from "@/models/Resume";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getScoreColor } from "@/utils/cn";
import { FileText, Upload, ArrowRight, Trash2 } from "lucide-react";
import { DeleteResumeButton } from "@/components/resume/delete-button";

export const metadata = { title: "Resume History - ResumeAI" };

async function getResumes(userId) {
  await connectDB();
  return Resume.find({ userId }).sort({ createdAt: -1 }).select("-parsedText");
}

export default async function HistoryPage() {
  const session = await auth();
  const resumes = await getResumes(session.user.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resume History</h1>
          <p className="text-muted-foreground">
            View and compare all your analyzed resumes
          </p>
        </div>
        <Link href="/upload">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload New
          </Button>
        </Link>
      </div>

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No resumes yet</h3>
            <p className="text-muted-foreground mb-4">Upload your first resume to get started</p>
            <Link href="/upload">
              <Button>Upload Resume</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {resumes.map((resume) => (
            <Card key={resume._id.toString()} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{resume.fileName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(resume.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex gap-3">
                      {resume.status === "completed" && (
                        <>
                          <div className="text-center">
                            <p className={`text-lg font-bold ${getScoreColor(resume.atsScore)}`}>
                              {resume.atsScore}
                            </p>
                            <p className="text-xs text-muted-foreground">ATS</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-lg font-bold ${getScoreColor(resume.grammarScore)}`}>
                              {resume.grammarScore}
                            </p>
                            <p className="text-xs text-muted-foreground">Grammar</p>
                          </div>
                        </>
                      )}
                      <Badge
                        variant={
                          resume.status === "completed"
                            ? "success"
                            : resume.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {resume.status}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      {resume.status === "completed" && (
                        <Link href={`/analysis/${resume._id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            View <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                      <DeleteResumeButton resumeId={resume._id.toString()} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
