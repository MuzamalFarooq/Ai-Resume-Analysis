"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Code2,
  Award,
  BookOpen,
  User,
  Loader2,
  Edit3,
} from "lucide-react";

export default function ProfileReviewPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

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

        setSession(data.session);
        setProfile(data.session.detectedProfile || {});
      } catch {
        toast.error("Failed to load profile for review");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [id, router]);

  async function handleGenerateResume() {
    setGenerating(true);
    try {
      // 1. Save any pending profile edits first
      await fetch(`/api/resume-builder/${id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });

      // 2. Trigger full ATS resume generation
      const res = await fetch(`/api/resume-builder/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: selectedTemplate }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to generate resume");
        return;
      }

      toast.success("ATS Resume Generated Successfully!");
      router.push(`/resume-builder/${id}/preview`);
    } catch {
      toast.error("Error generating resume");
    } finally {
      setGenerating(false);
    }
  }

  // Helper updater for personal info
  const updatePersonalInfo = (field, val) => {
    setProfile((prev) => ({
      ...prev,
      personalInfo: {
        ...(prev.personalInfo || {}),
        [field]: val,
      },
    }));
  };

  // Helper updater for experience
  const updateExp = (index, field, val) => {
    setProfile((prev) => {
      const expList = [...(prev.experience || [])];
      expList[index] = { ...expList[index], [field]: val };
      return { ...prev, experience: expList };
    });
  };

  const addExp = () => {
    setProfile((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        {
          company: "",
          title: prev.profession || "",
          location: "",
          startDate: "2023",
          endDate: "Present",
          current: true,
          bullets: ["Key accomplishment or responsibility..."],
          technologies: [],
        },
      ],
    }));
  };

  const removeExp = (index) => {
    setProfile((prev) => ({
      ...prev,
      experience: (prev.experience || []).filter((_, i) => i !== index),
    }));
  };

  // Helper updater for projects
  const updateProj = (index, field, val) => {
    setProfile((prev) => {
      const projList = [...(prev.projects || [])];
      projList[index] = { ...projList[index], [field]: val };
      return { ...prev, projects: projList };
    });
  };

  const addProj = () => {
    setProfile((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        {
          name: "",
          description: "",
          role: "Lead Contributor",
          technologies: [],
          bullets: [],
          liveUrl: "",
          githubUrl: "",
        },
      ],
    }));
  };

  const removeProj = (index) => {
    setProfile((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== index),
    }));
  };

  // Helper updater for education
  const updateEdu = (index, field, val) => {
    setProfile((prev) => {
      const eduList = [...(prev.education || [])];
      eduList[index] = { ...eduList[index], [field]: val };
      return { ...prev, education: eduList };
    });
  };

  const addEdu = () => {
    setProfile((prev) => ({
      ...prev,
      education: [
        ...(prev.education || []),
        {
          institution: "",
          degree: "Bachelor of Science",
          fieldOfStudy: prev.specialization || "",
          location: "",
          startDate: "2020",
          endDate: "2024",
          gpa: "",
          highlights: [],
        },
      ],
    }));
  };

  const removeEdu = (index) => {
    setProfile((prev) => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== index),
    }));
  };

  // Helper updater for skills
  const updateSkillsString = (val) => {
    const split = val.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    setProfile((prev) => ({
      ...prev,
      skills: [{ category: "Core Competencies", items: split }],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const allSkills = (profile.skills || []).flatMap((s) => s.items || []).join(", ");

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/resume-builder/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Interview</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Review Your Profile</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review and edit the information collected by the AI before generating your ATS resume.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          onClick={handleGenerateResume}
          disabled={generating}
          className="gap-2 shadow-md min-w-[190px]"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Resume...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate ATS Resume
            </>
          )}
        </Button>
      </div>

      {/* Template Selection Pill */}
      <div className="bg-card/70 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-sm font-semibold">Choose Resume Template Style</span>
          <p className="text-xs text-muted-foreground">You can also switch templates anytime in the preview editor.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "modern", name: "Modern" },
            { id: "classic", name: "Classic ATS" },
            { id: "minimal", name: "Minimal" },
            { id: "executive", name: "Executive" },
          ].map((tmpl) => (
            <Button
              key={tmpl.id}
              type="button"
              variant={selectedTemplate === tmpl.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTemplate(tmpl.id)}
              className="text-xs h-8 capitalize"
            >
              {tmpl.name}
            </Button>
          ))}
        </div>
      </div>

      {/* 1. Personal & Contact Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Contact & Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={profile.personalInfo?.fullName || ""}
                onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                placeholder="Alex Morgan"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Target Title / Profession</Label>
              <Input
                value={profile.personalInfo?.targetRole || profile.profession || ""}
                onChange={(e) => updatePersonalInfo("targetRole", e.target.value)}
                placeholder="Senior Full Stack Engineer"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                value={profile.personalInfo?.email || ""}
                onChange={(e) => updatePersonalInfo("email", e.target.value)}
                placeholder="alex@example.com"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone Number</Label>
              <Input
                value={profile.personalInfo?.phone || ""}
                onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location</Label>
              <Input
                value={profile.personalInfo?.location || ""}
                onChange={(e) => updatePersonalInfo("location", e.target.value)}
                placeholder="New York, NY"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">LinkedIn / Profile URL</Label>
              <Input
                value={profile.personalInfo?.linkedin || ""}
                onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                placeholder="linkedin.com/in/alexmorgan"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Professional Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-primary" />
            Professional Summary
          </CardTitle>
          <CardDescription className="text-xs">
            The AI will refine this summary to be concise and high-impact during generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={profile.personalInfo?.summary || ""}
            onChange={(e) => updatePersonalInfo("summary", e.target.value)}
            placeholder="Write or review your career summary..."
            className="min-h-[90px] text-sm"
          />
        </CardContent>
      </Card>

      {/* 3. Skills */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            Core Skills & Competencies
          </CardTitle>
          <CardDescription className="text-xs">
            Comma-separated keywords tailored to your field.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={allSkills}
            onChange={(e) => updateSkillsString(e.target.value)}
            placeholder="e.g., Next.js, TypeScript, PostgreSQL, Docker, AWS, Agile..."
            className="min-h-[80px] text-sm"
          />
        </CardContent>
      </Card>

      {/* 4. Work Experience */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Work Experience ({profile.experience?.length || 0})
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={addExp} className="gap-1 text-xs h-7">
            <Plus className="h-3 w-3" />
            Add Experience
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {(profile.experience || []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No work experience added yet. Click &quot;Add Experience&quot; to add a role.
            </p>
          ) : (
            profile.experience.map((exp, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3 relative bg-card/40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExp(i)}
                  className="absolute top-3 right-3 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                  <div className="space-y-1">
                    <Label className="text-xs">Job Title</Label>
                    <Input
                      value={exp.title || ""}
                      onChange={(e) => updateExp(i, "title", e.target.value)}
                      placeholder="Senior Engineer"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Company / Organization</Label>
                    <Input
                      value={exp.company || ""}
                      onChange={(e) => updateExp(i, "company", e.target.value)}
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      value={exp.startDate || ""}
                      onChange={(e) => updateExp(i, "startDate", e.target.value)}
                      placeholder="2022"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input
                      value={exp.endDate || (exp.current ? "Present" : "")}
                      onChange={(e) => updateExp(i, "endDate", e.target.value)}
                      placeholder="Present"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Responsibilities & Achievements (One per line or text)</Label>
                  <Textarea
                    value={Array.isArray(exp.bullets) ? exp.bullets.join("\n") : exp.bullets || ""}
                    onChange={(e) => updateExp(i, "bullets", e.target.value.split("\n"))}
                    placeholder="Describe your accomplishments..."
                    className="min-h-[70px] text-xs"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 5. Projects */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-primary" />
              Projects & Contributions ({profile.projects?.length || 0})
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={addProj} className="gap-1 text-xs h-7">
            <Plus className="h-3 w-3" />
            Add Project
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {(profile.projects || []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No projects added yet. Click &quot;Add Project&quot; to include portfolio work.
            </p>
          ) : (
            profile.projects.map((proj, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3 relative bg-card/40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProj(i)}
                  className="absolute top-3 right-3 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                  <div className="space-y-1">
                    <Label className="text-xs">Project Name</Label>
                    <Input
                      value={proj.name || ""}
                      onChange={(e) => updateProj(i, "name", e.target.value)}
                      placeholder="Healthcare Telemedicine Portal"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Your Role</Label>
                    <Input
                      value={proj.role || ""}
                      onChange={(e) => updateProj(i, "role", e.target.value)}
                      placeholder="Lead Developer / Designer"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Project Summary & Impact</Label>
                  <Textarea
                    value={proj.description || ""}
                    onChange={(e) => updateProj(i, "description", e.target.value)}
                    placeholder="Engineered an end-to-end platform serving 10k monthly active users..."
                    className="min-h-[60px] text-xs"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 6. Education */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Education & Degrees ({profile.education?.length || 0})
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={addEdu} className="gap-1 text-xs h-7">
            <Plus className="h-3 w-3" />
            Add Degree
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {(profile.education || []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No education listed. Click &quot;Add Degree&quot; to enter your studies.
            </p>
          ) : (
            profile.education.map((edu, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3 relative bg-card/40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEdu(i)}
                  className="absolute top-3 right-3 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                  <div className="space-y-1">
                    <Label className="text-xs">Degree</Label>
                    <Input
                      value={edu.degree || ""}
                      onChange={(e) => updateEdu(i, "degree", e.target.value)}
                      placeholder="Bachelor of Science"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Major / Field of Study</Label>
                    <Input
                      value={edu.fieldOfStudy || ""}
                      onChange={(e) => updateEdu(i, "fieldOfStudy", e.target.value)}
                      placeholder="Computer Science"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Institution</Label>
                    <Input
                      value={edu.institution || ""}
                      onChange={(e) => updateEdu(i, "institution", e.target.value)}
                      placeholder="University of Technology"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Graduation Year</Label>
                    <Input
                      value={edu.endDate || ""}
                      onChange={(e) => updateEdu(i, "endDate", e.target.value)}
                      placeholder="2024"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Bottom Floating/Fixed CTA */}
      <div className="flex items-center justify-between border-t pt-4">
        <Link href={`/resume-builder/${id}`}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Interview
          </Button>
        </Link>
        <Button
          size="lg"
          onClick={handleGenerateResume}
          disabled={generating}
          className="gap-2 shadow-lg min-w-[200px]"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Resume...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate ATS Resume
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
