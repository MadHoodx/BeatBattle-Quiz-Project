
"use client";

export default function CategoryPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070B1E] text-white">
      <div className="bg-white/5 p-10 rounded-3xl shadow-2xl border border-white/10 text-center max-w-lg w-full">
        <h1 className="text-3xl font-bold mb-4">Category (Coming Soon)</h1>
        <p className="text-lg text-white/70 mb-6">
          This page will let you select quiz categories in the future.<br />
          Stay tuned for updates!
        </p>
        <div className="flex justify-center">
          <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium animate-pulse">
            Placeholder
          </span>
        </div>
      </div>
    </div>
  );
}
