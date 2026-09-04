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
  Download,
  Save,
  RefreshCw,
  ArrowLeft,
  Eye,
  CheckCircle2,
  FileText,
  Edit3,
  Layers,
  Trash2,
  Plus,
  Loader2,
  Share2,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Code2,
  Award,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function ResumePreviewAndEditorPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("preview"); // "preview" | "editor"
  const [template, setTemplate] = useState("modern");
  const [resumeData, setResumeData] = useState(null);
  const [sectionOrder, setSectionOrder] = useState([]);

  // Section Regeneration Modal State
  const [regeneratingSection, setRegeneratingSection] = useState(null);
  const [regenPrompt, setRegenPrompt] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch(`/api/resume-builder/${id}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to load resume");
          router.push("/resume-builder");
          return;
        }

        setSession(data.session);
        const gen = data.session.generatedResume || {};
        setTemplate(gen.template || "modern");
        setResumeData(gen.resumeData || {});
        setSectionOrder(
          gen.sectionOrder || [
            "summary",
            "skills",
            "experience",
            "projects",
            "education",
            "certifications",
            "achievements",
          ]
        );
      } catch {
        toast.error("Failed to load resume");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [id, router]);

  async function handleSaveResume() {
    setSaving(true);
    try {
      const res = await fetch(`/api/resume-builder/${id}/save`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generatedResume: {
            template,
            resumeData,
            sectionOrder,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save edits");
        return;
      }

      toast.success("Resume saved successfully!");
      setSession(data.session);
    } catch {
      toast.error("Error saving resume");
    } finally {
      setSaving(false);
    }
  }

  function handleDownloadPdf() {
    window.open(`/api/resume-builder/${id}/export?format=pdf`, "_blank");
  }

  function handleDownloadJson() {
    window.open(`/api/resume-builder/${id}/export?format=json`, "_blank");
  }

  async function handleRegenerateSection() {
    if (!regeneratingSection) return;
    setRegenLoading(true);

    try {
      let currentContent = null;
      if (regeneratingSection === "summary") {
        currentContent = resumeData.summary;
      } else if (regeneratingSection === "skills") {
        currentContent = resumeData.skills;
      } else if (regeneratingSection.startsWith("exp_")) {
        const idx = parseInt(regeneratingSection.split("_")[1]);
        currentContent = resumeData.experience?.[idx];
      }

      const res = await fetch(`/api/resume-builder/${id}/regenerate-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionName: regeneratingSection.startsWith("exp_") ? "experience_bullets" : regeneratingSection,
          currentContent,
          promptInstruction: regenPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to regenerate section");
        return;
      }

      const reg = data.regenerated;
      if (regeneratingSection === "summary" && reg.summary) {
        setResumeData((prev) => ({ ...prev, summary: reg.summary }));
      } else if (regeneratingSection === "skills" && Array.isArray(reg.skills)) {
        setResumeData((prev) => ({ ...prev, skills: reg.skills }));
      } else if (regeneratingSection.startsWith("exp_") && Array.isArray(reg.bullets)) {
        const idx = parseInt(regeneratingSection.split("_")[1]);
        setResumeData((prev) => {
          const expList = [...(prev.experience || [])];
          expList[idx] = { ...expList[idx], bullets: reg.bullets };
          return { ...prev, experience: expList };
        });
      }

      toast.success("Section updated with AI!");
      setRegeneratingSection(null);
      setRegenPrompt("");
    } catch {
      toast.error("Failed to regenerate section");
    } finally {
      setRegenLoading(false);
    }
  }

  const moveSection = (idx, direction) => {
    const newOrder = [...sectionOrder];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    const temp = newOrder[idx];
    newOrder[idx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setSectionOrder(newOrder);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!resumeData) return null;

  const personal = resumeData.personal || {};
  const atsScore = session?.generatedResume?.atsScore || 92;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Top Action & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/resume-builder/${id}/review`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Review Profile</span>
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">Resume Studio & ATS Preview</h1>
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                ATS Score: {atsScore}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {personal.fullName || "Candidate"} • {personal.targetRole || "Professional Resume"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Template Switcher */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
            {["modern", "classic", "minimal", "executive"].map((tmpl) => (
              <button
                key={tmpl}
                onClick={() => setTemplate(tmpl)}
                className={`text-xs px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                  template === tmpl
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tmpl}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={handleSaveResume} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </Button>

          <Button size="sm" onClick={handleDownloadPdf} className="gap-1.5 shadow-sm">
            <Download className="h-3.5 w-3.5" />
            Download ATS PDF
          </Button>
        </div>
      </div>

      {/* Main Dual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Section Editor & Reordering (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 max-h-[85vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-primary" />
              Customize & Edit Sections
            </h3>
            <span className="text-xs text-muted-foreground">Live updates on right</span>
          </div>

          {/* 1. Header Details */}
          <Card className="border">
            <CardHeader className="py-2.5 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Personal Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  className="text-xs h-8"
                  value={personal.fullName || ""}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, personal: { ...personal, fullName: e.target.value } })
                  }
                  placeholder="Full Name"
                />
                <Input
                  className="text-xs h-8"
                  value={personal.targetRole || ""}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, personal: { ...personal, targetRole: e.target.value } })
                  }
                  placeholder="Target Role"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  className="text-xs h-8"
                  value={personal.email || ""}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, personal: { ...personal, email: e.target.value } })
                  }
                  placeholder="Email"
                />
                <Input
                  className="text-xs h-8"
                  value={personal.phone || ""}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, personal: { ...personal, phone: e.target.value } })
                  }
                  placeholder="Phone"
                />
              </div>
              <Input
                className="text-xs h-8"
                value={personal.location || ""}
                onChange={(e) =>
                  setResumeData({ ...resumeData, personal: { ...personal, location: e.target.value } })
                }
                placeholder="Location"
              />
            </CardContent>
          </Card>

          {/* 2. Professional Summary with AI rewrite */}
          <Card className="border">
            <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Professional Summary
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRegeneratingSection("summary");
                  setRegenPrompt("Make it more concise and impactful with strong action verbs.");
                }}
                className="h-6 text-[11px] gap-1 text-primary hover:bg-primary/10 px-2"
              >
                <Sparkles className="h-3 w-3" />
                Rewrite with AI
              </Button>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <Textarea
                className="text-xs min-h-[90px] leading-relaxed"
                value={resumeData.summary || ""}
                onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                placeholder="Professional summary..."
              />
            </CardContent>
          </Card>

          {/* 3. Skills */}
          <Card className="border">
            <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Skills & Keywords
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRegeneratingSection("skills");
                  setRegenPrompt("Organize into clean industry-standard technical categories with high ATS search value.");
                }}
                className="h-6 text-[11px] gap-1 text-primary hover:bg-primary/10 px-2"
              >
                <Sparkles className="h-3 w-3" />
                AI Categorize
              </Button>
            </CardHeader>
            <CardContent className="py-2 px-4 space-y-2">
              {(resumeData.skills || []).map((skillCat, catIdx) => (
                <div key={catIdx} className="space-y-1">
                  <Input
                    className="text-xs h-7 font-semibold"
                    value={skillCat.category || ""}
                    onChange={(e) => {
                      const list = [...(resumeData.skills || [])];
                      list[catIdx] = { ...list[catIdx], category: e.target.value };
                      setResumeData({ ...resumeData, skills: list });
                    }}
                    placeholder="Category Title"
                  />
                  <Input
                    className="text-xs h-7"
                    value={skillCat.items?.join(", ") || ""}
                    onChange={(e) => {
                      const list = [...(resumeData.skills || [])];
                      list[catIdx] = {
                        ...list[catIdx],
                        items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      };
                      setResumeData({ ...resumeData, skills: list });
                    }}
                    placeholder="Comma-separated skills"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 4. Experience Bullets & AI rewrite */}
          <Card className="border">
            <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Work Experience ({resumeData.experience?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4 space-y-3">
              {(resumeData.experience || []).map((exp, expIdx) => (
                <div key={expIdx} className="border rounded-md p-2.5 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">
                      {exp.title || "Role"} • {exp.company || "Company"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRegeneratingSection(`exp_${expIdx}`);
                        setRegenPrompt("Rewrite these bullet points to start with strong action verbs and emphasize quantified impact.");
                      }}
                      className="h-6 text-[10px] gap-1 text-primary hover:bg-primary/10 px-1.5"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      AI Enhance Bullets
                    </Button>
                  </div>

                  <Textarea
                    className="text-xs min-h-[70px]"
                    value={Array.isArray(exp.bullets) ? exp.bullets.join("\n") : exp.bullets || ""}
                    onChange={(e) => {
                      const list = [...(resumeData.experience || [])];
                      list[expIdx] = { ...list[expIdx], bullets: e.target.value.split("\n") };
                      setResumeData({ ...resumeData, experience: list });
                    }}
                    placeholder="Enter bullet points (one per line)..."
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section Reorder Control */}
          <Card className="border">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Section Order
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4 space-y-1">
              {sectionOrder.map((sec, idx) => (
                <div
                  key={sec}
                  className="flex items-center justify-between py-1 px-2 rounded bg-muted/40 text-xs capitalize"
                >
                  <span>{sec}</span>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, -1)}
                      className="h-5 w-5 p-0"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={idx === sectionOrder.length - 1}
                      onClick={() => moveSection(idx, 1)}
                      className="h-5 w-5 p-0"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Live ATS Resume Document (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-primary" />
                ATS Preview ({template} template)
              </span>
              <span className="text-xs text-muted-foreground">Standard 8.5&quot; x 11&quot; Aspect</span>
            </div>

            {/* Resume Page Sheet */}
            <div
              className={`bg-white text-slate-900 border rounded-xl shadow-2xl p-8 sm:p-10 font-sans transition-all min-h-[780px] space-y-5 text-sm ${
                template === "classic"
                  ? "font-serif"
                  : template === "minimal"
                  ? "font-sans tracking-tight"
                  : ""
              }`}
            >
              {/* Header */}
              {template === "classic" ? (
                <div className="text-center border-b pb-4 space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {personal.fullName || "Your Full Name"}
                  </h2>
                  {personal.targetRole && (
                    <p className="text-xs font-semibold text-slate-700 tracking-wide">
                      {personal.targetRole}
                    </p>
                  )}
                  <p className="text-xs text-slate-600">
                    {[personal.email, personal.phone, personal.location, personal.linkedin]
                      .filter(Boolean)
                      .join("  |  ")}
                  </p>
                </div>
              ) : template === "executive" ? (
                <div className="bg-slate-900 text-white -mx-8 -mt-8 sm:-mx-10 sm:-mt-10 p-6 rounded-t-xl space-y-1">
                  <h2 className="text-2xl font-bold">{personal.fullName || "Your Full Name"}</h2>
                  <p className="text-xs text-slate-300 font-medium">{personal.targetRole}</p>
                  <p className="text-[11px] text-slate-400">
                    {[personal.email, personal.phone, personal.location, personal.linkedin]
                      .filter(Boolean)
                      .join("  •  ")}
                  </p>
                </div>
              ) : (
                <div className="border-b pb-4 space-y-1">
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    {personal.fullName || "Your Full Name"}
                  </h2>
                  {personal.targetRole && (
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      {personal.targetRole}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {[personal.email, personal.phone, personal.location, personal.linkedin, personal.portfolio]
                      .filter(Boolean)
                      .join("  •  ")}
                  </p>
                </div>
              )}

              {/* Sections mapped according to sectionOrder */}
              {sectionOrder.map((section) => {
                if (section === "summary" && resumeData.summary) {
                  return (
                    <div key="summary" className="space-y-1.5">
                      <h3
                        className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${
                          template === "executive" ? "text-blue-900 border-blue-900/30" : "text-slate-800"
                        }`}
                      >
                        Professional Summary
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-700">{resumeData.summary}</p>
                    </div>
                  );
                }

                if (section === "skills" && Array.isArray(resumeData.skills) && resumeData.skills.length > 0) {
                  return (
                    <div key="skills" className="space-y-1.5">
                      <h3
                        className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${
                          template === "executive" ? "text-blue-900 border-blue-900/30" : "text-slate-800"
                        }`}
                      >
                        Core Skills & Competencies
                      </h3>
                      <div className="space-y-1 text-xs">
                        {resumeData.skills.map((cat, i) => (
                          <div key={i} className="flex flex-wrap gap-1">
                            <span className="font-semibold text-slate-900">{cat.category}:</span>
                            <span className="text-slate-700">{cat.items?.join(", ")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (section === "experience" && Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
                  return (
                    <div key="experience" className="space-y-2.5">
                      <h3
                        className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${
                          template === "executive" ? "text-blue-900 border-blue-900/30" : "text-slate-800"
                        }`}
                      >
                        Professional Experience
                      </h3>
                      {resumeData.experience.map((exp, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                            <span>{exp.title}</span>
                            <span className="font-normal text-slate-500">
                              {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-slate-600">
                            {[exp.company, exp.location].filter(Boolean).join(" • ")}
                          </div>
                          {Array.isArray(exp.bullets) && exp.bullets.length > 0 && (
                            <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700 pt-0.5">
                              {exp.bullets.filter(Boolean).map((bullet, bIdx) => (
                                <li key={bIdx} className="leading-snug">
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }

                if (section === "projects" && Array.isArray(resumeData.projects) && resumeData.projects.length > 0) {
                  return (
                    <div key="projects" className="space-y-2">
                      <h3
                        className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${
                          template === "executive" ? "text-blue-900 border-blue-900/30" : "text-slate-800"
                        }`}
                      >
                        Key Projects
                      </h3>
                      {resumeData.projects.map((proj, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                            <span>{proj.name}</span>
                            {proj.role && <span className="font-normal text-slate-500">{proj.role}</span>}
                          </div>
                          {proj.description && (
                            <p className="text-xs text-slate-700 leading-snug">{proj.description}</p>
                          )}
                          {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                            <p className="text-[11px] text-slate-500 italic">
                              Technologies: {proj.technologies.join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }

                if (section === "education" && Array.isArray(resumeData.education) && resumeData.education.length > 0) {
                  return (
                    <div key="education" className="space-y-2">
                      <h3
                        className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${
                          template === "executive" ? "text-blue-900 border-blue-900/30" : "text-slate-800"
                        }`}
                      >
                        Education & Qualifications
                      </h3>
                      {resumeData.education.map((edu, i) => (
                        <div key={i} className="space-y-0.5 text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" in ")}</span>
                            <span className="font-normal text-slate-500">
                              {[edu.startDate, edu.endDate].filter(Boolean).join(" - ")}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-slate-600">{edu.institution}</div>
                          {edu.gpa && <div className="text-[11px] text-slate-500">GPA: {edu.gpa}</div>}
                        </div>
                      ))}
                    </div>
                  );
                }

                if (section === "certifications" && Array.isArray(resumeData.certifications) && resumeData.certifications.length > 0) {
                  return (
                    <div key="certifications" className="space-y-1.5">
                      <h3
                        className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${
                          template === "executive" ? "text-blue-900 border-blue-900/30" : "text-slate-800"
                        }`}
                      >
                        Certifications & Licenses
                      </h3>
                      <ul className="list-disc list-outside pl-4 space-y-0.5 text-xs text-slate-700">
                        {resumeData.certifications.map((cert, i) => (
                          <li key={i}>
                            <span className="font-semibold text-slate-900">{cert.name}</span>
                            {cert.issuer && ` - ${cert.issuer}`}
                            {cert.issueDate && ` (${cert.issueDate})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI Section Regeneration Modal */}
      {regeneratingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-lg border-primary/20 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Section Rewrite
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRegeneratingSection(null)}
                  className="h-7 w-7 p-0 rounded-full"
                >
                  ✕
                </Button>
              </div>
              <CardDescription className="text-xs">
                Provide custom instructions to guide the AI in rewriting this specific section.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Custom Instruction (Optional)</Label>
                <Textarea
                  value={regenPrompt}
                  onChange={(e) => setRegenPrompt(e.target.value)}
                  placeholder="e.g., Focus on leadership and quantify outcomes with percentages..."
                  className="min-h-[80px] text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRegeneratingSection(null)}
                  disabled={regenLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleRegenerateSection}
                  disabled={regenLoading}
                  className="gap-1.5 min-w-[120px]"
                >
                  {regenLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Rewriting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Apply AI Rewrite
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
