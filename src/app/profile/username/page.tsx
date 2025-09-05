"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../frontend/context/AuthContext";
import { updateProfile } from "../../../backend/services/database/db";
import { supabase } from "../../../lib/supabase";

export default function UsernamePage() {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!user) {
      setError("กรุณา login ใหม่");
      setLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
      setError("Username ต้องมี 3-16 ตัว a-z, 0-9, _ เท่านั้น");
      setLoading(false);
      return;
    }
    try {
      await updateProfile(user.id, username);
      // login อัตโนมัติอีกครั้งเพื่อ refresh session
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: ""
      });
      // ไม่ต้องสนใจ error เพราะ session อาจ active อยู่แล้ว
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070B1E] text-white px-4">
      <div className="w-full max-w-md bg-white/5 rounded-2xl p-8 shadow-xl border border-white/10">
        <h1 className="text-2xl font-bold mb-6 text-center">ตั้งชื่อผู้ใช้</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={16}
            minLength={3}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/30"
            placeholder="Username (3-16 ตัว a-z, 0-9, _ )"
          />
          {error && <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกชื่อผู้ใช้'}
          </button>
        </form>
      </div>
    </div>
  );
}
