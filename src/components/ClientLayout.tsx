"use client";
import React, { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import HamburgerMenu from "@/components/common/HamburgerMenu";
import Avatar from "@/components/common/Avatar";
import LogoHomeButton from "@/components/common/LogoHomeButton";
import LangLink from "@/components/common/LangLink";
import { useI18n } from '@/context/I18nContext';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <AuthProvider>
  <div className="relative min-h-screen flex flex-col bg-[#070a18]">
        <header className="group fixed top-0 left-0 w-full z-50">
          <div className="relative mx-auto flex items-center gap-4 px-5 sm:px-8 py-3">
            {/* Background glass + gradient border */}
            <div className="absolute inset-0 z-0 pointer-events-none backdrop-blur-xl bg-[#0b0f1f]/70 border-b border-white/10 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-fuchsia-400/40 after:to-transparent" />
            <button
              className="relative z-10 flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 shadow-inner shadow-black/40"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <div className="space-y-1.5">
                <span className="block h-0.5 w-6 rounded bg-white"></span>
                <span className="block h-0.5 w-6 rounded bg-white"></span>
                <span className="block h-0.5 w-6 rounded bg-white"></span>
              </div>
            </button>
            <div className="relative z-10">
              <LogoHomeButton />
            </div>
            <div className="flex-1" />
            <nav className="relative z-10 hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
              <InlineLink href="/mode" labelKey="modes" />
              <InlineLink href="/category" labelKey="categories" />
              <InlineLink href="/leaderboard" labelKey="leaderboard" />
            </nav>
            <div className="relative z-10 flex items-center gap-3">
              <Avatar />
            </div>
          </div>
        </header>
        <HamburgerMenu open={menuOpen} setOpen={setMenuOpen} />
  <main className="flex-1 pt-16 sm:pt-10">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}

function InlineLink({ href, label, labelKey }: { href: string; label?: string; labelKey?: string }) {
  const { t } = useI18n();
  const text = labelKey ? t(labelKey) : (label || '');
  return (
    <LangLink
      href={href}
      className="relative px-2 py-1 hover:text-white transition before:absolute before:inset-x-0 before:bottom-0 before:h-px before:scale-x-0 hover:before:scale-x-100 before:origin-left before:bg-gradient-to-r before:from-fuchsia-400 before:via-pink-400 before:to-violet-400 before:transition-transform"
    >
      {text}
    </LangLink>
  );
}

