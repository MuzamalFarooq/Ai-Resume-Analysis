"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MessageSquare } from "lucide-react";

export default function MockInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [questionCount, setQuestionCount] = useState(15);

  async function handleStart(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole, questionCount }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      toast.success("Interview session created!");
      router.push(`/mock-interview/${data.session._id}`);
    } catch {
      toast.error("Failed to create interview");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Mock Interview</h1>
        <p className="text-muted-foreground">
          Practice with AI-generated questions based on your resume and target role
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Start New Interview
          </CardTitle>
          <CardDescription>
            Questions will be generated based on your latest analyzed resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStart} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Target Role</Label>
              <Input
                id="role"
                placeholder="e.g. Full Stack Developer, Product Manager"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">Number of Questions</Label>
              <Input
                id="count"
                type="number"
                min={10}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Start Interview
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { type: "Technical", desc: "Role-specific technical questions", color: "text-blue-500" },
          { type: "HR", desc: "Behavioral and situational questions", color: "text-green-500" },
          { type: "Behavioral", desc: "STAR method practice questions", color: "text-purple-500" },
        ].map((item) => (
          <Card key={item.type}>
            <CardContent className="p-4 text-center">
              <Badge className="mb-2">{item.type}</Badge>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
