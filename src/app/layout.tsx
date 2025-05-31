import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import AuthProvider from "@/providers/AuthProvider";
import Navbar from "@/components/Navbar";
import { PostHogProvider } from "./PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ladder - Productivity App",
  description: "Track tasks and see progress in your community program",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <AuthProvider>
            <PostHogProvider>
              <nav className="mb-20">
                <Navbar />
              </nav>
              {children}
            </PostHogProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
