import type { Metadata } from "next";

import "./globals.css";
import "./fonts.css"

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
          {children}
        </Suspense>
      </body>
    </html>
  );
}
