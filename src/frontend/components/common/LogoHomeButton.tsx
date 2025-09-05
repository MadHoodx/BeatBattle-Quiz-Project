"use client";
import { useRouter } from "next/navigation";
export default function LogoHomeButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/")}
      aria-label="Go to home"
      className="ml-4 flex items-center cursor-pointer group"
      type="button"
      style={{ outline: 'none' }}
    >
      <img src="/logo.png" alt="BeatBattle Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
      <span className="sr-only">Home</span>
      <style jsx>{`
        button.group:hover img, button.group:focus img {
          filter: brightness(1.2) drop-shadow(0 0 6px #7c6cff44);
        }
      `}</style>
    </button>
  );
}