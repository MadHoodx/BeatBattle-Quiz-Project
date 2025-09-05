"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function CategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "solo";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070B1E] text-white">
      <h1 className="text-3xl font-bold mb-8">เลือกหมวดเพลง</h1>
      <div className="flex gap-8">
        <button
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-xl shadow-lg hover:scale-105 hover:from-purple-600 hover:to-pink-600 transition"
          onClick={() => router.push(`/quiz?mode=${mode}&category=kdrama-ost`)}
        >
          Kdrama OST
        </button>
        {/* เพิ่มหมวดอื่นๆ ได้ที่นี่ */}
      </div>
    </div>
  );
}
