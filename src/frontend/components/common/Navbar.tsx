"use client";
import React from "react";
import Link from "next/link";
import { useI18n } from "../../context/I18nContext";

export default function Navbar() {
  const { lang } = useI18n();
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 z-50 relative">
      <Link href={`/${lang}`}> 
        <img src="/logo.png" alt="Logo" className="h-10 w-auto select-none" />
      </Link>
      {/* Add more nav content here if needed */}
    </nav>
  );
}
