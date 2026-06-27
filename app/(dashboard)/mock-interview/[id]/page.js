"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { getScoreColor } from "@/utils/cn";

export default function InterviewSessionPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evaluations, setEvaluations] = useState({});

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

      const evals = {};
      data.session.answers?.forEach((a) => {
        evals[a.questionId] = a;
      });
      setEvaluations(evals);
    } catch {
      toast.error("Failed to load session");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!answer.trim()) return;
    setSubmitting(true);

    const question = session.questions[currentIndex];

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          questionId: question.id,
          answer,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      setEvaluations((prev) => ({
        ...prev,
        [question.id]: data.evaluation,
      }));

      toast.success(`Score: ${data.evaluation.score}/100`);

      if (data.sessionComplete) {
        toast.success("Interview complete!");
        router.push(`/interview-result/${id}`);
        return;
      }

      setAnswer("");
      if (currentIndex < session.questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch {
      toast.error("Failed to submit answer");
    } finally {
      setSubmitting(false);
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

  const question = session.questions[currentIndex];
  const progress = ((Object.keys(evaluations).length) / session.questions.length) * 100;
  const currentEval = evaluations[question?.id];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Mock Interview</h1>
        <p className="text-muted-foreground">{session.targetRole}</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Question {currentIndex + 1} of {session.questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{question?.type}</Badge>
            <Badge variant="secondary">{question?.category}</Badge>
          </div>
          <CardTitle className="text-lg leading-relaxed">{question?.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentEval ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Your Answer:</p>
                <p className="text-sm">{currentEval.answer}</p>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Score</span>
                  <span className={`text-xl font-bold ${getScoreColor(currentEval.score)}`}>
                    {currentEval.score}/100
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>Accuracy: {currentEval.accuracy}%</div>
                  <div>Communication: {currentEval.communication}%</div>
                  <div>Confidence: {currentEval.confidence}%</div>
                  <div>Clarity: {currentEval.clarity}%</div>
                </div>
                <p className="text-sm text-muted-foreground">{currentEval.feedback}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Your Answer</Label>
                <Textarea
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={6}
                />
              </div>
              <Button
                onClick={handleSubmitAnswer}
                disabled={submitting || !answer.trim()}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit Answer
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.min(session.questions.length - 1, currentIndex + 1))}
          disabled={currentIndex === session.questions.length - 1}
          className="gap-1"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
