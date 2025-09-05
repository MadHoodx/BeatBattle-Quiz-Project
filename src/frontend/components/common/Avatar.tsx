"use client";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function Avatar() {
  const { user } = useAuth();
  if (!user) return null;
  const letter = user.user_metadata?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  return (
    <Link href="/profile" className="ml-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold shadow-lg border-2 border-white/20 hover:scale-105 transition cursor-pointer">
        {letter}
      </div>
    </Link>
  );
}
