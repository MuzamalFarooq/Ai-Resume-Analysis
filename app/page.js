import Link from "next/link";
import { LandingHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  FileSearch,
  Target,
  MessageSquare,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: FileSearch,
    title: "ATS Score Analysis",
    description:
      "Get a comprehensive ATS compatibility score with keyword optimization, formatting, and readability analysis.",
  },
  {
    icon: Target,
    title: "Skill Gap Detection",
    description:
      "Compare your resume against job descriptions to identify matched skills, gaps, and learning recommendations.",
  },
  {
    icon: MessageSquare,
    title: "AI Mock Interviews",
    description:
      "Practice with AI-generated technical and HR questions tailored to your skills and target role.",
  },
  {
    icon: TrendingUp,
    title: "Career Roadmap",
    description:
      "Receive personalized career recommendations including roles, certifications, and skills to learn.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track your progress with visual charts showing ATS scores, skill gaps, and interview performance trends.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your resume data is encrypted and securely stored. We never share your information with third parties.",
  },
];

const steps = [
  { step: "1", title: "Upload Resume", description: "Upload your PDF or DOCX resume" },
  { step: "2", title: "AI Analysis", description: "Get instant ATS scoring and insights" },
  { step: "3", title: "Improve & Practice", description: "Apply suggestions and mock interview" },
  { step: "4", title: "Land Your Job", description: "Track progress and ace interviews" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />

      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 gradient-bg" />
        <div className="container relative mx-auto px-4 text-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              Powered by OpenAI
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              AI-Powered Resume
              <br />
              <span className="gradient-text">Analysis Platform</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Upload your resume for instant ATS scoring, skill gap analysis,
              AI improvement suggestions, and mock interview practice.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="text-base px-8">
                  Get Started Free
                  <Zap className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-base px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto animate-slide-up">
            {[
              { value: "95%", label: "ATS Accuracy" },
              { value: "10K+", label: "Resumes Analyzed" },
              { value: "50+", label: "Skill Categories" },
              { value: "4.9", label: "User Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to optimize your resume and prepare for interviews
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-card p-6 hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Four simple steps to career success</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-muted-foreground">Start free, upgrade when you need more</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="rounded-xl border bg-card p-8">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <ul className="space-y-3 mb-6 text-sm">
                <li>3 resume analyses/month</li>
                <li>Basic ATS scoring</li>
                <li>5 mock interview questions</li>
                <li>Job match analysis</li>
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>
            <div className="rounded-xl border-2 border-primary bg-card p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="text-3xl font-bold mb-4">$19<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <ul className="space-y-3 mb-6 text-sm">
                <li>Unlimited resume analyses</li>
                <li>Full AI improvements</li>
                <li>20 mock interview questions</li>
                <li>PDF report export</li>
                <li>Career roadmap</li>
                <li>Priority support</li>
              </ul>
              <Link href="/register">
                <Button className="w-full">Start Pro Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Optimize Your Resume?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of job seekers who improved their resumes with AI-powered analysis.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-base px-8">
              Start Analyzing Now
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="h-5 w-5 text-primary" />
            ResumeAI
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ResumeAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
