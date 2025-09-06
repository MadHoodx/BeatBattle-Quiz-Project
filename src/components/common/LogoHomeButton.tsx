"use client";
import LangLink from './LangLink';
export default function LogoHomeButton() {
  return (
    <span className="ml-4 flex items-center cursor-pointer group">
      <LangLink href="/" aria-label="Go to home">
        <img src="/logo.png" alt="BeatBattle Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
        <span className="sr-only">Home</span>
      </LangLink>
      <style jsx>{`
        .group:hover img, .group:focus img {
          filter: brightness(1.2) drop-shadow(0 0 6px #7c6cff44);
        }
      `}</style>
    </span>
  );
}