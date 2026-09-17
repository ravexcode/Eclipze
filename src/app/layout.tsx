import type { Metadata } from "next";

import "./globals.css";
import "./fonts.css";
import "lenis/dist/lenis.css";

import Lenis from "@/lib/lenis";
import { AnnouncementProvider } from "@/components/announcements/announcement-provider";

import { Suspense } from "react";

export const metadata: Metadata = {
  title: {
    default: "Eclipze | Developer Workflow Platform",
    template: "%s | Eclipze",
  },
  description:
    "Eclipze gives developer teams a focused workspace for projects, issues, and AI agents.",
  applicationName: "Eclipze",
  keywords: ["developer workflow", "project management", "AI agents", "developer teams"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/app_icon.svg", type: "image/svg+xml" },
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
