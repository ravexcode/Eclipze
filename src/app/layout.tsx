import type { Metadata } from "next";

import "./globals.css";
import "./fonts.css";
import "lenis/dist/lenis.css";

import Lenis from "@/lib/lenis";

import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Eclipse",
  description: "App built for developer teams workflow",
  icons: {
    icon: "/favicon.ico",
  }
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
          <Lenis>
            {children}
          </Lenis>
        </Suspense>
      </body>
    </html>
  );
}
