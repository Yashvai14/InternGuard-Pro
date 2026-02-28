import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "InternGuard - Fake Internship Detector",
    template: "%s | InternGuard",
  },
  description: "AI-powered fake internship and job post detection system for students",
  keywords: ["fake internship", "scam detection", "job post verification", "student safety"],
  authors: [{ name: "InternGuard" }],
  creator: "InternGuard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-slate-50 antialiased text-slate-800">
        {children}
      </body>
    </html>
  );
}
