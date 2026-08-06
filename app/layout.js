import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/providers/toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://resumeanalyzer.muzamal.site";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ResumeAI - Free AI Resume Analyzer, ATS Checker & Mock Interview",
    template: "%s | ResumeAI",
  },
  description:
    "Free AI Resume Analyzer & ATS Score Checker. Get instant feedback on your resume, skill gap analysis, AI bullet point improvements, and practice AI mock interviews.",
  keywords: [
    "resume analyzer",
    "ATS score checker",
    "AI resume review",
    "free ATS resume checker",
    "mock interview AI",
    "resume optimization",
    "skill gap detection",
    "AI career coach",
    "ResumeAI",
    "resume checker",
    "job description match",
  ],
  authors: [{ name: "ResumeAI", url: siteUrl }],
  creator: "ResumeAI",
  publisher: "ResumeAI",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "ResumeAI - Free AI Resume Analyzer & Mock Interview Platform",
    description:
      "Upload your resume for free instant ATS scoring, skill gap analysis, AI bullet point improvements, and practice mock interviews.",
    url: siteUrl,
    siteName: "ResumeAI",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ResumeAI - AI Resume Analyzer & Mock Interview Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeAI - Free AI Resume Analyzer & Mock Interview Platform",
    description:
      "Upload your resume for free instant ATS scoring, skill gap analysis, AI bullet point improvements, and practice mock interviews.",
    images: [`${siteUrl}/og-image.png`],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
