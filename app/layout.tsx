import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppFrame } from "@/components/layout/app-frame";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cornerstone | Acacia Therapy Homes",
  description: "Cloud operating platform for children's residential homes, safeguarding, compliance, and oversight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
