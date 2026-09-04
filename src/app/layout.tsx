import type { Metadata } from "next";

import "./globals.css";
import "./fonts.css"

export const metadata: Metadata = {
  title: "Eclipse",
  description: "Developer dashboard inspired by the Figma design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-base bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
