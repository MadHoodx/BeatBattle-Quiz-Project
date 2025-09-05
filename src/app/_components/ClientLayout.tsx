"use client";
import { ReactNode } from "react";
import { AuthProvider } from "../../frontend/context/AuthContext";
import HamburgerMenu from "../../frontend/components/common/HamburgerMenu";
import Avatar from "../../frontend/components/common/Avatar";
import LogoHomeButton from "../../frontend/components/common/LogoHomeButton";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="relative min-h-screen">
        {/* Header: Hamburger left, logo.png next to hamburger (link to home), avatar far right */}
        <header className="w-full flex items-center px-8 py-4 fixed top-0 left-0 z-50 bg-[#070B1E] border-b border-[#23244a] shadow-md">
          <HamburgerMenu />
          <LogoHomeButton />
          <div className="flex-1"></div>
          <Avatar />
        </header>
        <main className="pt-20">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
