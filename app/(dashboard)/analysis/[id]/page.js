"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CircularProgress } from "@/components/ui/progress";
import { SectionRadarChart, ScoreBarChart } from "@/components/charts/charts";
import { AnalysisSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getScoreColor } from "@/utils/cn";
import {
  Download,
  ArrowLeft,
  AlertTriangle,
  Lightbulb,
  Briefcase,
  GraduationCap,
  Loader2,
} from "lucide-react";

export default function AnalysisPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    fetchResume();
  }, [id]);

  async function fetchResume() {
    try {
      const res = await fetch(`/api/resume/${id}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        router.push("/dashboard");
        return;
      }

      setResume(data.resume);

      if (data.resume.status === "pending" || data.resume.status === "processing") {
        setPolling(true);
        setTimeout(fetchResume, 3000);
      } else {
        setPolling(false);
      }
    } catch {
      toast.error("Failed to load analysis");
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    window.open(`/api/export/${id}?type=resume`, "_blank");
  }

  if (loading) return <AnalysisSkeleton />;

  if (!resume) return null;

  if (resume.status === "pending" || resume.status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold mb-2">Analyzing your resume...</h2>
        <p className="text-muted-foreground">This may take a minute</p>
      </div>
    );
  }

  if (resume.status === "failed") {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Analysis Failed</h2>
        <p className="text-muted-foreground mb-4">We couldn&apos;t analyze this resume</p>
        <Link href="/upload">
          <Button>Try Again</Button>
        </Link>
      </div>
    );
  }

  const sectionData = resume.sectionScores
    ? Object.entries(resume.sectionScores).map(([section, score]) => ({
        section: section.charAt(0).toUpperCase() + section.slice(1),
        score,
      }))
    : [];

  const scoreData = [
    { name: "ATS", score: resume.atsScore },
    { name: "Grammar", score: resume.grammarScore },
    { name: "Readability", score: resume.readabilityScore },
    { name: "Formatting", score: resume.formattingScore },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/history">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{resume.fileName}</h1>
            <p className="text-muted-foreground">Resume Analysis Report</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Link href="/job-match">
            <Button variant="outline" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Job Match
            </Button>
          </Link>
        </div>
      </div>

      {/* Overall Scores */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="md:col-span-1 flex items-center justify-center p-6">
          <CircularProgress value={resume.atsScore} size={140} />
        </Card>
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBarChart data={scoreData} />
          </CardContent>
        </Card>
      </div>

      {/* Section Scores & Extracted Data */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Section Analysis</CardTitle>
            <CardDescription>Score by resume section</CardDescription>
          </CardHeader>
          <CardContent>
            {sectionData.length > 0 ? (
              <SectionRadarChart data={sectionData} />
            ) : (
              <p className="text-muted-foreground text-center py-8">No section data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracted Skills</CardTitle>
            <CardDescription>{resume.extractedSkills?.length || 0} skills found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {resume.extractedSkills?.map((skill) => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
            {resume.extractedData && (
              <div className="mt-4 space-y-2 text-sm">
                {resume.extractedData.name && (
                  <p><span className="font-medium">Name:</span> {resume.extractedData.name}</p>
                )}
                {resume.extractedData.email && (
                  <p><span className="font-medium">Email:</span> {resume.extractedData.email}</p>
                )}
                {resume.extractedData.education?.length > 0 && (
                  <div>
                    <p className="font-medium flex items-center gap-1"><GraduationCap className="h-4 w-4" /> Education:</p>
                    <ul className="ml-5 list-disc text-muted-foreground">
                      {resume.extractedData.education.slice(0, 3).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {resume.recommendations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {resume.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Grammar Issues */}
      {resume.grammarIssues?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Grammar & Wording Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resume.grammarIssues.map((issue, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={issue.severity === "high" ? "destructive" : "warning"}>
                      {issue.type?.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm">{issue.text}</p>
                  <p className="text-sm text-muted-foreground mt-1">{issue.suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Improvements */}
      {resume.aiImprovements?.summary && (
        <Card>
          <CardHeader>
            <CardTitle>AI-Improved Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{resume.aiImprovements.summary}</p>
            {resume.aiImprovements.bulletPoints?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Improved Bullet Points</h4>
                <ul className="space-y-2">
                  {resume.aiImprovements.bulletPoints.map((bp, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span> {bp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Career Recommendations */}
      {resume.careerRecommendations?.jobRoles?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Career Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Suggested Roles</h4>
              <div className="flex flex-wrap gap-2">
                {resume.careerRecommendations.jobRoles.map((role) => (
                  <Badge key={role}>{role}</Badge>
                ))}
              </div>
            </div>
            {resume.careerRecommendations.skillsToLearn?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Skills to Learn</h4>
                <div className="flex flex-wrap gap-2">
                  {resume.careerRecommendations.skillsToLearn.map((skill) => (
                    <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
            {resume.careerRecommendations.roadmap?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Career Roadmap</h4>
                <ol className="space-y-2">
                  {resume.careerRecommendations.roadmap.map((step, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="font-bold text-primary">{i + 1}.</span> {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
