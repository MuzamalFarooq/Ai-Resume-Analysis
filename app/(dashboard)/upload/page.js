import { ResumeUploader } from "@/components/resume/upload-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";

export const metadata = { title: "Upload Resume - ResumeAI" };

export default function UploadPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Upload Resume</h1>
        <p className="text-muted-foreground">
          Upload your PDF or DOCX resume for AI-powered analysis
        </p>
      </div>

      <ResumeUploader />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Supported Formats
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>• PDF (.pdf)</p>
            <p>• Word Document (.docx)</p>
            <p>• Maximum file size: 8MB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              What We Analyze
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>• ATS compatibility score</p>
            <p>• Grammar & readability</p>
            <p>• Skills extraction</p>
            <p>• Section-by-section scoring</p>
            <p>• AI improvement suggestions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Tips for best results</p>
            <p className="text-muted-foreground mt-1">
              Use a text-based PDF (not scanned images). Include clear section headers,
              bullet points with action verbs, and quantifiable achievements.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
