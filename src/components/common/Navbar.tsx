"use client";
import React from "react";
import LangLink from "./LangLink";
import { useI18n } from "../../context/I18nContext";

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 z-50 relative">
      <span className="flex items-center">
        <LangLink href="/">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto select-none" />
        </LangLink>
      </span>
      {/* Add more nav content here if needed */}
    </nav>
  );
}
