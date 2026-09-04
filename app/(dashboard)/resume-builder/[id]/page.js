"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  CheckCircle2,
  HelpCircle,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Code2,
  Award,
  BookOpen,
  User,
  Loader2,
  Eye,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ResumeInterviewPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch(`/api/resume-builder/${id}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to load session");
          router.push("/resume-builder");
          return;
        }

        if (data.session.status === "completed") {
          router.push(`/resume-builder/${id}/preview`);
          return;
        }

        if (data.session.status === "review" && !data.session.currentQuestion) {
          router.push(`/resume-builder/${id}/review`);
          return;
        }

        setSession(data.session);
      } catch {
        toast.error("Error loading session");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [id, router]);

  async function handleSubmitAnswer(e) {
    if (e) e.preventDefault();
    if (!answer.trim()) {
      toast.error("Please provide an answer or click Skip");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/resume-builder/${id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to process answer");
        return;
      }

      setAnswer("");
      setSession(data.session);

      if (data.isComplete || data.session.status === "review") {
        toast.success("Interview complete! Moving to Profile Review.");
        router.push(`/resume-builder/${id}/review`);
      } else {
        toast.success("Answer recorded!");
      }
    } catch {
      toast.error("Error submitting answer");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setSkipping(true);
    try {
      const res = await fetch(`/api/resume-builder/${id}/skip`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to skip question");
        return;
      }

      setAnswer("");
      setSession(data.session);

      if (data.isComplete || data.session.status === "review") {
        toast.success("Moving to Profile Review.");
        router.push(`/resume-builder/${id}/review`);
      }
    } catch {
      toast.error("Error skipping question");
    } finally {
      setSkipping(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Preparing your personalized AI interview...</p>
      </div>
    );
  }

  if (!session) return null;

  const currentQ = session.currentQuestion || {
    id: "q_final",
    question: "Do you have any additional achievements, certifications, or projects to add?",
    category: "completeness",
    whyItMatters: "Final details help maximize your ATS score.",
    suggestions: ["AWS Certified Solutions Architect", "Dean's List Honoree", "Open-source contributor"],
  };

  const profile = session.detectedProfile || {};
  const history = session.questionHistory || [];
  const completeness = session.completenessScore || 25;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/resume-builder">
            <Button variant="ghost" size="sm" className="gap-1.5 h-8">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">AI Resume Interview</h1>
              <Badge variant="outline" className="text-xs">
                {profile.profession || "Candidate"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Industry: <span className="text-foreground font-medium">{profile.industry || "General"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/resume-builder/${id}/review`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <Eye className="h-3.5 w-3.5" />
              Review Profile & Generate
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress & Completeness Bar */}
      <div className="space-y-1.5 bg-card/60 border rounded-xl p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Resume Profile Completeness
          </span>
          <span className="font-bold text-primary">{completeness}%</span>
        </div>
        <Progress value={completeness} className="h-2" />
      </div>

      {/* Main Question Workspace */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize text-xs font-semibold">
                {currentQ.category || "General"}
              </Badge>
              {currentQ.isFollowUp && (
                <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                  Follow-up Question
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">Question {history.length + 1}</span>
          </div>

          <CardTitle className="text-xl sm:text-2xl leading-snug font-bold text-foreground">
            {currentQ.question}
          </CardTitle>

          {currentQ.whyItMatters && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50">
              <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{currentQ.whyItMatters}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Smart suggestion chips */}
          {Array.isArray(currentQ.suggestions) && currentQ.suggestions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Suggested Examples:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentQ.suggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setAnswer((prev) => (prev ? `${prev}, ${sug}` : sug));
                    }}
                    className="text-xs text-left bg-accent/60 hover:bg-primary/10 hover:text-primary border border-border/70 rounded-md px-2.5 py-1 transition-all"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Answer Input */}
          <div className="space-y-2">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={currentQ.placeholder || "Describe in your own words. The AI will convert it into high-impact, professional resume language..."}
              className="min-h-[140px] text-sm leading-relaxed"
              autoFocus
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={submitting || skipping}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {skipping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SkipForward className="h-3.5 w-3.5" />}
              Skip Question
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={submitting || skipping || !answer.trim()}
                className="gap-2 shadow-sm min-w-[130px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Profile Captured Checklist & History Drawer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile State Card */}
        <Card className="border bg-card/40">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Information Captured So Far
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{profile.personalInfo?.fullName || "Contact Details"}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{profile.education?.length || 0} Education items</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{profile.experience?.length || 0} Work Roles</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                <FolderGit2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{profile.projects?.length || 0} Projects</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{(profile.skills || []).reduce((acc, s) => acc + (s.items?.length || 0), 0)} Skills</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                <Award className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{profile.certifications?.length || 0} Certifications</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversation History Toggle */}
        <Card className="border bg-card/40">
          <CardHeader
            className="py-3 px-4 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setShowHistory(!showHistory)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Interview History ({history.length})
              </CardTitle>
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {showHistory && (
            <CardContent className="py-2 px-4 max-h-[220px] overflow-y-auto space-y-2 text-xs">
              {history.length === 0 ? (
                <p className="text-muted-foreground py-2">No questions answered yet.</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="border-b last:border-0 pb-2 space-y-1">
                    <p className="font-semibold text-foreground">Q: {h.question}</p>
                    <p className="text-muted-foreground italic">
                      A: {h.skipped ? "Skipped" : h.answer}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
