import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import JobCoachProvider from "@/components/ai/JobCoachProvider";
import "./globals.css";

const sans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const mono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "IT-Bewerbungs-Management-Tool",
  description: "Revolutionäres Bewerbungsmanagement für IT-Profis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <JobCoachProvider />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
