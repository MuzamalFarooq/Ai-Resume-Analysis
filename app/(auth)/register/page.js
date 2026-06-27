import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Register - ResumeAI",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gradient-bg">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-8">
        <Sparkles className="h-6 w-6 text-primary" />
        ResumeAI
      </Link>
      <RegisterForm />
    </div>
  );
}
