"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileSearch,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ScanLine,
  Zap,
  Bot,
  BrainCircuit,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ANALYSIS_STAGES = [
  {
    id: 1,
    title: "Document Ingestion & Text Extraction",
    description: "Parsing formatting, structure, and text hierarchy",
    icon: FileSearch,
    duration: 1800,
  },
  {
    id: 2,
    title: "ATS Compatibility & Keyword Scanner",
    description: "Cross-referencing 25+ ATS parameters & industry keywords",
    icon: ScanLine,
    duration: 2200,
  },
  {
    id: 3,
    title: "Grok AI Deep Resume Analysis",
    description: "Evaluating impact, grammar, action verbs & readability",
    icon: BrainCircuit,
    duration: 2600,
  },
  {
    id: 4,
    title: "Synthesizing Scores & Career Recommendations",
    description: "Finalizing section ratings, improvements, and interview prep",
    icon: Sparkles,
    duration: 1800,
  },
];

export function PremiumAnalysisLoader({
  fileName = "Resume Document",
  progress: externalProgress,
  onComplete,
}) {
  const [currentStage, setCurrentStage] = useState(0);
  const [internalProgress, setInternalProgress] = useState(15);

  const isExternal = typeof externalProgress === "number";
  const displayProgress = isExternal ? externalProgress : internalProgress;
  const displayStage = isExternal
    ? Math.min(
        ANALYSIS_STAGES.length - 1,
        Math.floor((externalProgress / 100) * ANALYSIS_STAGES.length)
      )
    : currentStage;

  useEffect(() => {
    if (isExternal) return;

    // Otherwise run a smooth realistic multi-step animation
    let totalElapsed = 0;
    const interval = setInterval(() => {
      totalElapsed += 150;
      const pct = Math.min(96, Math.floor(15 + (totalElapsed / 8000) * 80));
      setInternalProgress(pct);

      if (totalElapsed > 6500) {
        setCurrentStage(3);
      } else if (totalElapsed > 4000) {
        setCurrentStage(2);
      } else if (totalElapsed > 1800) {
        setCurrentStage(1);
      } else {
        setCurrentStage(0);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isExternal]);

  const activeStageInfo = ANALYSIS_STAGES[displayStage] || ANALYSIS_STAGES[0];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-card/95 via-card/80 to-background/95 p-6 md:p-10 shadow-2xl backdrop-blur-xl">
      {/* Ambient background glowing orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Holographic Document Scanner Icon */}
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
          {/* Pulsing outer rings */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full border border-primary/30 bg-primary/5"
          />
          <motion.div
            animate={{
              scale: [1.1, 1.45, 1.1],
              opacity: [0.15, 0.4, 0.15],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute inset-0 rounded-full border border-indigo-400/20"
          />

          {/* Core Central Card */}
          <div className="relative flex h-20 w-16 flex-col items-center justify-center overflow-hidden rounded-xl border border-primary/40 bg-card/90 shadow-lg shadow-primary/20 backdrop-blur-md">
            {/* Animated Laser Scanning Line */}
            <motion.div
              animate={{
                top: ["-10%", "110%", "-10%"],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_#3b82f6]"
            />

            {/* Document preview dummy lines */}
            <div className="flex flex-col gap-1.5 w-full px-2.5 opacity-60">
              <div className="h-1.5 w-3/4 rounded bg-primary/70" />
              <div className="h-1 w-full rounded bg-muted-foreground/40" />
              <div className="h-1 w-5/6 rounded bg-muted-foreground/40" />
              <div className="h-1 w-2/3 rounded bg-muted-foreground/40" />
              <div className="h-1 w-4/5 rounded bg-muted-foreground/40" />
            </div>

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-1 right-1"
            >
              <Sparkles className="h-3 w-3 text-primary" />
            </motion.div>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3 shadow-inner">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_#3b82f6]"
          />
          AI Analysis in Progress
        </div>

        {/* Title and Active Status */}
        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-1">
          Analyzing {fileName}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Our AI engine is evaluating your resume across 25+ ATS benchmarks, keyword density, and grammar impact.
        </p>

        {/* Modern Progress Bar with percentage */}
        <div className="w-full max-w-lg mb-8 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground">
              <Cpu className="h-3.5 w-3.5 text-primary animate-pulse" />
              {activeStageInfo.title}
            </span>
            <span className="font-mono text-primary font-bold">{displayProgress}%</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/60 p-0.5 border border-border/40">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-indigo-500 to-primary bg-[length:200%_100%]"
              initial={{ width: "10%" }}
              animate={{
                width: `${displayProgress}%`,
                backgroundPosition: ["0% 0%", "100% 0%"],
              }}
              transition={{
                width: { duration: 0.4, ease: "easeOut" },
                backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" },
              }}
            />
          </div>
        </div>

        {/* Multi-Stage Step Progress List */}
        <div className="w-full max-w-md grid grid-cols-1 gap-2.5 text-left">
          {ANALYSIS_STAGES.map((stage, idx) => {
            const isDone = idx < displayStage;
            const isCurrent = idx === displayStage;
            const Icon = stage.icon;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center gap-3 rounded-xl p-2.5 transition-all duration-300 ${
                  isCurrent
                    ? "border border-primary/40 bg-primary/10 shadow-sm"
                    : isDone
                    ? "border border-border/30 bg-muted/30 opacity-80"
                    : "border border-transparent opacity-40"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isDone
                      ? "bg-green-500/20 text-green-500"
                      : isCurrent
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className={`h-4 w-4 ${isCurrent ? "animate-pulse" : ""}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-semibold truncate ${
                      isCurrent
                        ? "text-primary"
                        : isDone
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stage.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {stage.description}
                  </p>
                </div>

                {isCurrent && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full shrink-0"
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Live Feature Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-border/40 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2.5 py-1">
            <Bot className="h-3 w-3 text-primary" /> Grok AI Powered
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2.5 py-1">
            <ShieldCheck className="h-3 w-3 text-green-500" /> ATS Compatibility Check
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2.5 py-1">
            <Zap className="h-3 w-3 text-amber-500" /> Instant Optimization
          </span>
        </div>
      </div>
    </div>
  );
}
