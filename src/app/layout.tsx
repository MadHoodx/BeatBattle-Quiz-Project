

import type { Metadata } from "next";
import "@/styles/globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets:["latin"], variable:"--font-inter", display:"swap" });

export const metadata: Metadata = {
  title: "BeatBattle",
  description: "Music Guess Battle",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#070a18] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
