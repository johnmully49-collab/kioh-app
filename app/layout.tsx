import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ApplicationProvider } from "@/context/ApplicationContext";
import { NotificationProvider } from "@/context/NotificationContext";
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
  title: "Kenya Innovation & Opportunity Hub (KIOH)",
  description:
    "A modern ecosystem connecting youth, graduates, and innovators across Kenya.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-white flex flex-col selection:bg-teal-500/30">
        <SessionProvider>
          <ApplicationProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </ApplicationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}