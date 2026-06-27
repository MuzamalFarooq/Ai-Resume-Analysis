"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/progress";
import { toast } from "sonner";
import { getScoreColor } from "@/utils/cn";
import { Download, ArrowLeft, Trophy, Loader2 } from "lucide-react";

export default function InterviewResultPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, [id]);

  async function fetchSession() {
    try {
      const res = await fetch(`/api/interview/${id}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        router.push("/mock-interview");
        return;
      }
      setSession(data.session);
    } catch {
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const avgScores = session.answers?.length
    ? {
        accuracy: Math.round(session.answers.reduce((s, a) => s + (a.accuracy || 0), 0) / session.answers.length),
        communication: Math.round(session.answers.reduce((s, a) => s + (a.communication || 0), 0) / session.answers.length),
        confidence: Math.round(session.answers.reduce((s, a) => s + (a.confidence || 0), 0) / session.answers.length),
        clarity: Math.round(session.answers.reduce((s, a) => s + (a.clarity || 0), 0) / session.answers.length),
      }
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/mock-interview">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Interview Results</h1>
          <p className="text-muted-foreground">{session.targetRole}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8 flex flex-col items-center text-center">
          <Trophy className={`h-12 w-12 mb-4 ${getScoreColor(session.score)}`} />
          <CircularProgress value={session.score} size={160} />
          <h2 className="text-xl font-semibold mt-4">Overall Score</h2>
          {session.feedback && (
            <p className="text-muted-foreground mt-3 max-w-lg">{session.feedback}</p>
          )}
          <Button
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => window.open(`/api/export/${id}?type=interview`, "_blank")}
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </CardContent>
      </Card>

      {avgScores && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(avgScores).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${getScoreColor(value)}`}>{value}%</p>
                <p className="text-xs text-muted-foreground capitalize">{key}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {session.questions?.map((q, i) => {
            const answer = session.answers?.find((a) => a.questionId === q.id);
            return (
              <div key={q.id} className="p-4 rounded-lg border">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary">Q{i + 1}</span>
                      <Badge variant="outline" className="text-xs">{q.type}</Badge>
                    </div>
                    <p className="text-sm font-medium">{q.question}</p>
                  </div>
                  {answer && (
                    <span className={`font-bold text-lg ${getScoreColor(answer.score)}`}>
                      {answer.score}
                    </span>
                  )}
                </div>
                {answer && (
                  <>
                    <p className="text-sm text-muted-foreground mt-2">{answer.answer}</p>
                    <p className="text-xs text-muted-foreground mt-2 italic">{answer.feedback}</p>
                  </>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Link href="/mock-interview">
          <Button>New Interview</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
