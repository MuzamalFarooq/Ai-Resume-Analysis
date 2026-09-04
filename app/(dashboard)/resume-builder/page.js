"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Sparkles,
  Plus,
  FileText,
  Clock,
  ArrowRight,
  Trash2,
  CheckCircle2,
  Brain,
  ShieldCheck,
  Stethoscope,
  Laptop,
  Compass,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/utils/cn";

export default function ResumeBuilderHubPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Initial Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    targetRole: "",
    degree: "",
    fieldOfStudy: "",
    yearsOfExperience: "2",
  });

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/resume-builder/sessions");
        const data = await res.json();
        if (res.ok) {
          setSessions(data.sessions || []);
        }
      } catch {
        toast.error("Failed to load resume builder sessions");
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  async function handleStartInterview(e) {
    e.preventDefault();
    if (!formData.targetRole.trim()) {
      toast.error("Please enter your target role or profession");
      return;
    }

    setStarting(true);
    try {
      const res = await fetch("/api/resume-builder/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to initialize interview");
        return;
      }

      toast.success("AI Interview started!");
      router.push(`/resume-builder/${data.session._id}`);
    } catch {
      toast.error("An error occurred starting the interview");
    } finally {
      setStarting(false);
    }
  }

  async function handleDeleteSession(id, e) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this resume builder session?")) return;

    try {
      const res = await fetch(`/api/resume-builder/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Session deleted");
        setSessions((prev) => prev.filter((s) => s._id !== id));
      } else {
        toast.error("Failed to delete session");
      }
    } catch {
      toast.error("Error deleting session");
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-accent/15 border p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Dynamic AI-Powered Interview Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            AI Resume Builder
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Create an ATS-optimized, high-impact resume through an intelligent conversational AI interview.
            The AI dynamically asks questions tailored specifically to your profession—whether you are in
            Software Engineering, Healthcare, Engineering, Marketing, Business, or any other field.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => setShowModal(true)} className="gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              Start New AI Interview
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Start Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-xl border-primary/20 shadow-2xl relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Begin Your AI Interview
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="h-8 w-8 rounded-full p-0"
                >
                  ✕
                </Button>
              </div>
              <CardDescription>
                Provide baseline details so our AI can customize its questions to your exact career path.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStartInterview} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="e.g., Alex Morgan"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="targetRole">Target Role / Profession *</Label>
                    <Input
                      id="targetRole"
                      placeholder="e.g., Full Stack Engineer, Cardiologist"
                      value={formData.targetRole}
                      onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="alex@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="degree">Highest Degree</Label>
                    <Input
                      id="degree"
                      placeholder="e.g., BS, MD, MS, MBA"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fieldOfStudy">Major / Field of Study</Label>
                    <Input
                      id="fieldOfStudy"
                      placeholder="e.g., Computer Science, Medicine"
                      value={formData.fieldOfStudy}
                      onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="location">Location (City, Country)</Label>
                    <Input
                      id="location"
                      placeholder="e.g., New York, NY"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      min={0}
                      max={40}
                      value={formData.yearsOfExperience}
                      onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={starting} className="gap-2 min-w-[140px]">
                    {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Start Interview
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feature Highlights for Professions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Laptop, label: "IT & Tech", desc: "Frameworks, tools, architecture & impact" },
          { icon: Stethoscope, label: "Healthcare", desc: "Clinical rotations, departments & licenses" },
          { icon: Compass, label: "Engineering", desc: "CAD tools, simulations, design & projects" },
          { icon: TrendingUp, label: "Business & Mktg", desc: "Campaigns, revenue metrics & leadership" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border bg-card/40">
              <CardContent className="p-4 space-y-1 text-center">
                <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary mb-1">
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold">{item.label}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Existing Sessions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Your Resume Sessions</h2>
            <p className="text-xs text-muted-foreground">Continue where you left off or view completed resumes</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold">No resumes created yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Start your first dynamic AI interview to generate a customized ATS-compliant resume in minutes.
              </p>
              <Button onClick={() => setShowModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Resume with AI
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((sess) => {
              const profile = sess.detectedProfile || {};
              const isCompleted = sess.status === "completed";
              const isReview = sess.status === "review";
              const targetUrl = isCompleted
                ? `/resume-builder/${sess._id}/preview`
                : isReview
                ? `/resume-builder/${sess._id}/review`
                : `/resume-builder/${sess._id}`;

              return (
                <Card
                  key={sess._id}
                  onClick={() => router.push(targetUrl)}
                  className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <Badge
                          variant={isCompleted ? "default" : isReview ? "secondary" : "outline"}
                          className="capitalize text-[11px]"
                        >
                          {sess.status === "completed"
                            ? "Completed"
                            : sess.status === "review"
                            ? "Review Ready"
                            : "Interviewing"}
                        </Badge>
                        <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-1">
                          {sess.title || `${profile.profession || "AI"} Resume`}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteSession(sess._id, e)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <CardDescription className="text-xs line-clamp-1">
                      {profile.industry || "General"} • {profile.profession || "Professional"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Profile Completeness</span>
                        <span className="font-medium text-foreground">{sess.completenessScore || 20}%</span>
                      </div>
                      <Progress value={sess.completenessScore || 20} className="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(sess.updatedAt)}</span>
                      </div>
                      <span className="font-medium text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        {isCompleted ? "View Resume" : isReview ? "Review & Generate" : "Continue"}
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
