import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { assertBaseEnv } from "@/lib/config";

import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"]
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"]
});

const baseEnv = assertBaseEnv();

export const metadata: Metadata = {
  title: baseEnv.appName,
  description:
    "AI trading copilot and signal-triggered SoDEX testnet execution powered by SoSoValue research."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} bg-paper text-ink`}>
        <div className="min-h-screen bg-paper text-ink">
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
