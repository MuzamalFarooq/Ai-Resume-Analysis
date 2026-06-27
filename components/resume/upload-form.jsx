"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { generateUploadDropzone } from "@uploadthing/react";
import { ourFileRouter } from "@/app/api/uploadthing/core";

const UploadDropzone = generateUploadDropzone(ourFileRouter);

export function ResumeUploader({ onUploadComplete }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      if (f.size > 8 * 1024 * 1024) {
        toast.error("File size must be under 8MB");
        return;
      }
      setFile(f);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  async function handleManualUpload() {
    if (!file) return;

    setUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgress(30);

      const uploadRes = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload failed");
      }

      setProgress(70);
      const { resume } = await uploadRes.json();
      setProgress(100);

      toast.success("Resume uploaded! Analysis started.");
      onUploadComplete?.(resume);

      setTimeout(() => {
        router.push(`/analysis/${resume._id}`);
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          {isDragActive ? (
            <p className="text-lg font-medium">Drop your resume here</p>
          ) : (
            <>
              <p className="text-lg font-medium">Drag & drop your resume</p>
              <p className="text-sm text-muted-foreground">
                PDF or DOCX, max 8MB
              </p>
            </>
          )}
        </div>
      </div>

      {file && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!uploading && (
                <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={handleManualUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Analyze Resume"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading & analyzing...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or use UploadThing</span>
        </div>
      </div>

      <UploadDropzone
        endpoint="resumeUploader"
        onClientUploadComplete={async (res) => {
          if (!res?.[0]) return;
          setUploading(true);
          try {
            const uploadRes = await fetch("/api/resume", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileUrl: res[0].url,
                fileName: res[0].name,
                fileType: res[0].type,
              }),
            });
            const data = await uploadRes.json();
            if (uploadRes.ok) {
              toast.success("Resume uploaded!");
              router.push(`/analysis/${data.resume._id}`);
            } else {
              toast.error(data.error);
            }
          } catch {
            toast.error("Failed to save resume");
          } finally {
            setUploading(false);
          }
        }}
        onUploadError={(error) => {
          toast.error(error.message);
        }}
        appearance={{
          container: "border-2 border-dashed rounded-xl p-6 ut-uploading:opacity-50",
          label: "text-sm text-muted-foreground",
          allowedContent: "text-xs text-muted-foreground",
          button: "bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm ut-ready:bg-primary ut-uploading:bg-primary/70",
        }}
      />
    </div>
  );
}
