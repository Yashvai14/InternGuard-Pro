import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Your App Name",
    template: "%s | Your App Name",
  },
  description: "Your app description here",
  keywords: ["Next.js", "App Router", "Your App"],
  authors: [{ name: "Your Name" }],
  creator: "Your Name",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-orange-50 antialiased">
        {children}
      </body>
    </html>
  );
}