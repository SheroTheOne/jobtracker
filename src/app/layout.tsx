import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";
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
  title: { default: "jobtracker", template: "%s · jobtracker" },
  description: "Håll koll på jobbansökningar och matcha CV mot annonser.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="bg-background flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto grid w-full max-w-5xl flex-1 content-start gap-8 px-4 py-8">{children}</main>
        <Toaster richColors />
      </body>
    </html>
  );
}
