import type { Metadata } from "next";

import "./globals.css";
import "./fonts.css";
import "lenis/dist/lenis.css";

import Lenis from "@/lib/lenis";
import { AnnouncementProvider } from "@/components/announcements/announcement-provider";

import { Suspense } from "react";

//Vercel settings
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: {
    default: "Eclipze | AI Agent Workspace for Independent Developers",
    template: "%s | Eclipze",
  },
  description:
    "Organize client projects, turn outcomes into implementation plans, and review repository changes from AI agents in one workspace.",
  applicationName: "Eclipze",
  keywords: ["independent developers", "AI agent workspace", "client projects", "repository agents"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-base bg-background text-foreground antialiased">
        <Analytics />
        <Suspense fallback={<div></div>}>
          <AnnouncementProvider>
            <Lenis>
              {children}
            </Lenis>
          </AnnouncementProvider>
        </Suspense>
      </body>
    </html>
  );
}
