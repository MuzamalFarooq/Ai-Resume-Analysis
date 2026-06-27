import { ResetPasswordForm } from "@/components/auth/register-form";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Reset Password - ResumeAI",
};

export default function ResetPasswordPage({ searchParams }) {
  const token = searchParams?.token || "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gradient-bg">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-8">
        <Sparkles className="h-6 w-6 text-primary" />
        ResumeAI
      </Link>
      <ResetPasswordForm token={token} />
    </div>
  );
}
