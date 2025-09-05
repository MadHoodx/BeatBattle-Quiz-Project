"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../frontend/context/AuthContext";
import { useState, useEffect } from "react";
import { getProfile } from "../backend/services/database/db";

// Mock leaderboard data (replace with real data fetch later)
const mockLeaderboard = [
  { username: "Jisoo", score: 10 },
  { username: "Minho", score: 9 },
  { username: "Somi", score: 8 },
  { username: "Taeyang", score: 7 },
  { username: "Yuna", score: 6 },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      getProfile(user.id).then(setProfile);
    }
  }, [user]);

  // TODO: fetch real leaderboard data here

  const goToLogin = () => router.push("/auth");
  const goToMode = () => router.push("/mode");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070B1E] text-white px-4">
      {/* Logo & Title */}
      <header className="mb-8 flex flex-col items-center">
        <Image src="/logo.svg" alt="BeatBattle Logo" width={80} height={80} className="mb-2" />
        <h1 className="text-4xl font-bold">BeatBattle</h1>
        <p className="text-lg text-white/70 mt-2 text-center max-w-md">
          ทายเพลง K-Drama OST และแข่งกับเพื่อน! สนุกกับการทดสอบความรู้เพลงและดูอันดับของคุณบน Leaderboard
        </p>
      </header>


      {/* Main Action Buttons */}
      {!user ? (
        <div className="flex flex-col gap-4 mb-8 w-full max-w-xs">
          <button
            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold text-xl shadow-lg hover:scale-105 hover:from-purple-600 hover:to-pink-600 transition"
            onClick={goToLogin}
          >
            Login / Sign Up
          </button>
          <button
            className="w-full px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white/80 font-semibold text-xl shadow-lg hover:bg-white/20 hover:text-white transition"
            onClick={goToMode}
          >
            เล่นแบบ Guest
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 mb-8 w-full max-w-xs">
          <div className="text-lg text-white/80 mb-2">Welcome, {profile?.username || user.email}!</div>
          <button
            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold text-xl shadow-lg hover:scale-105 hover:from-purple-600 hover:to-pink-600 transition"
            onClick={goToMode}
          >
            เริ่มเล่นเลย!
          </button>
        </div>
      )}

      {/* Leaderboard: show only if logged in */}
      {user && (
        <section className="w-full max-w-md mb-8">
          <h2 className="text-2xl font-bold mb-4">🏆 Leaderboard</h2>
          <ul className="bg-white/5 rounded-xl divide-y divide-white/10">
            {leaderboard.map((entry, idx) => (
              <li key={entry.username} className="flex justify-between items-center px-6 py-3">
                <span className="font-semibold">{idx + 1}. {entry.username}</span>
                <span className="font-bold text-purple-300">{entry.score}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-auto py-4 text-white/50 text-sm text-center w-full">
        © 2025 BeatBattle | <a href="mailto:contact@beatbattle.com" className="underline">Contact</a>
      </footer>
    </div>
  );
}
