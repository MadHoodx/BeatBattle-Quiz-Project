"use client";
import React, { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import HamburgerMenu from "@/components/common/HamburgerMenu";
import Avatar from "@/components/common/Avatar";
import LogoHomeButton from "@/components/common/LogoHomeButton";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <AuthProvider>
      <div className="relative min-h-screen">
        {/* Header: Hamburger left, logo next to hamburger, avatar far right */}
  <header className="w-full flex items-center px-6 py-2 fixed top-0 left-0 z-50 bg-[#070B1E]">
          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#393a6e] transition"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              style={{ minWidth: 40, minHeight: 40 }}
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 32 32">
                <rect y="7" width="28" height="3.5" rx="1.5" fill="#fff" />
                <rect y="14" width="28" height="3.5" rx="1.5" fill="#fff" />
                <rect y="21" width="28" height="3.5" rx="1.5" fill="#fff" />
              </svg>
            </button>
            <div className="flex items-center h-10">
              <LogoHomeButton />
            </div>
          </div>
          <div className="flex-1"></div>
          <Avatar />
        </header>
        <HamburgerMenu open={menuOpen} setOpen={setMenuOpen} />
        <main className="pt-16">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}

