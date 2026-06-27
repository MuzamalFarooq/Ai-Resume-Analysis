"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SkillsPieChart } from "@/components/charts/charts";
import { toast } from "sonner";
import { Loader2, Target, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { getScoreColor } from "@/utils/cn";

export default function JobMatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      setResult(data.jobMatch);
      toast.success("Job match analysis complete!");
    } catch {
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Job Match Analysis</h1>
        <p className="text-muted-foreground">
          Paste a job description to compare against your latest resume
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
          <CardDescription>Paste the full job description below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title (optional)</Label>
              <Input
                id="title"
                placeholder="e.g. Senior Software Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                placeholder="Paste the full job description here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                required
                minLength={50}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Analyze Match
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6 animate-slide-up">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(result.matchScore)}`}>
                    {result.matchScore}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Match Score</p>
                </div>
                <div className="flex-1 w-full">
                  <Progress value={result.matchScore} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Matched Skills ({result.matchedSkills?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.matchedSkills?.map((skill) => (
                    <Badge key={skill} variant="success">{skill}</Badge>
                  ))}
                  {!result.matchedSkills?.length && (
                    <p className="text-sm text-muted-foreground">No matched skills found</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Missing Skills ({result.missingSkills?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.missingSkills?.map((skill) => (
                    <Badge key={skill} variant="destructive">{skill}</Badge>
                  ))}
                  {!result.missingSkills?.length && (
                    <p className="text-sm text-muted-foreground">No missing skills detected</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {result.matchedSkills?.length > 0 && result.missingSkills?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skills Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <SkillsPieChart
                  matched={result.matchedSkills}
                  missing={result.missingSkills}
                />
              </CardContent>
            </Card>
          )}

          {result.suggestions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
