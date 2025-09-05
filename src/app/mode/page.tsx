"use client";
import { useRouter } from "next/navigation";

export default function ModePage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070B1E] text-white">
      <h1 className="text-3xl font-bold mb-8">เลือกโหมดการเล่น</h1>
      <div className="flex gap-8">
        <button
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-xl shadow-lg hover:scale-105 hover:from-purple-600 hover:to-pink-600 transition"
          onClick={() => router.push("/category?mode=solo")}
        >
          เล่นคนเดียว
        </button>
        <button
          className="px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white/80 font-semibold text-xl shadow-lg hover:bg-white/20 hover:text-white transition"
          onClick={() => router.push("/category?mode=friend")}
        >
          เล่นกับเพื่อน (เร็วๆนี้)
        </button>
      </div>
    </div>
  );
}
