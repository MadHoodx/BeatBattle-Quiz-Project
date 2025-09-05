"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../common/Avatar";
import { getProfile } from "../../../backend/services/database/db";
import Image from "next/image";

const languages = [
  { code: "en", label: "English" },
  { code: "th", label: "ไทย" },
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      getProfile(user.id).then(setProfile);
    }
  }, [user]);

  const handleLangChange = (code: string) => {
    setLang(code);
  };

  return (
    <>
      {/* Hamburger button only, no logo */}
      <button
        className={`flex items-center justify-center px-2 py-2 rounded-lg bg-[#23244a] hover:bg-[#6c63ff] transition border-none shadow ${open ? 'ring-2 ring-[#6c63ff]' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        style={{ minWidth: 48, minHeight: 48 }}
      >
        {open ? (
          <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
            <line x1="7" y1="7" x2="25" y2="25" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="7" y1="25" x2="25" y2="7" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
            <rect y="7" width="28" height="3.5" rx="1.5" fill="#fff" />
            <rect y="14" width="28" height="3.5" rx="1.5" fill="#fff" />
            <rect y="21" width="28" height="3.5" rx="1.5" fill="#fff" />
          </svg>
        )}
      </button>

           {/* Overlay + Sidebar (only when open) */}
           {open && (
             <>
               <div
                 className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
                 onClick={() => setOpen(false)}
               ></div>
               <nav
                 className="fixed top-0 left-0 h-full w-[340px] bg-gradient-to-b from-[#23244a] via-[#181a2a] to-[#181a2a] z-[60] shadow-2xl transform transition-transform duration-300 border-r border-[#23244a]"
                 aria-label="Sidebar menu"
                 style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' }}
               >
                 <div className="flex items-center gap-3 px-7 py-7 border-b border-[#23244a] bg-[#23244a]/80">
                   {/* Close (X) button */}
                   <button
                     className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#393a6e] transition"
                     aria-label="Close menu"
                     onClick={() => setOpen(false)}
                   >
                     <svg width="28" height="28" fill="none" viewBox="0 0 32 32">
                       <line x1="8" y1="8" x2="24" y2="24" stroke="#b5baff" strokeWidth="3" strokeLinecap="round" />
                       <line x1="8" y1="24" x2="24" y2="8" stroke="#b5baff" strokeWidth="3" strokeLinecap="round" />
                     </svg>
                   </button>
                   {/* BeatBattle text only, closer to X */}
                   <span className="font-extrabold text-2xl tracking-tight text-[#7c6cff] drop-shadow select-none cursor-pointer ml-2" onClick={() => {router.push('/'); setOpen(false);}}>BeatBattle</span>
                 </div>
                 <ul className="mt-8 space-y-4 px-7">
                   <li>
                     <Link href="/quiz" onClick={() => setOpen(false)} className="flex items-center gap-4 py-3 px-4 rounded-xl text-white text-xl font-bold bg-[#23244a]/60 hover:bg-[#6c63ff]/20 transition shadow-md">
                       <span className="text-3xl" role="img" aria-label="quiz">
                         <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8 24V20C8 17.7909 9.79086 16 12 16H20C22.2091 16 24 17.7909 24 20V24" stroke="#7c6cff" strokeWidth="2.2" strokeLinecap="round"/><circle cx="16" cy="12" r="4" fill="#7c6cff"/></svg>
                       </span>
                       เล่นเกม (Music Quiz)
                     </Link>
                   </li>
                   <li>
                     <Link href="/category" onClick={() => setOpen(false)} className="flex items-center gap-4 py-3 px-4 rounded-xl text-white text-xl font-bold bg-[#23244a]/60 hover:bg-[#ffb84d]/20 transition shadow-md">
                       <span className="text-3xl" role="img" aria-label="category">
                         <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="6" y="8" width="20" height="16" rx="3" fill="#ffb84d"/><rect x="10" y="4" width="12" height="6" rx="2" fill="#fff"/></svg>
                       </span>
                       หมวดหมู่/โหมด
                     </Link>
                   </li>
                   <li>
                     <Link href="/leaderboard" onClick={() => setOpen(false)} className="flex items-center gap-4 py-3 px-4 rounded-xl text-white text-xl font-bold bg-[#23244a]/60 hover:bg-[#ffd700]/20 transition shadow-md">
                       <span className="text-3xl" role="img" aria-label="leaderboard">
                         <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" fill="#ffd700"/><text x="16" y="22" textAnchor="middle" fontSize="16" fill="#23244a" fontWeight="bold">🏆</text></svg>
                       </span>
                       Leaderboard
                     </Link>
                   </li>
                 </ul>
                 <div className="mt-10 border-t border-[#23244a] pt-6 px-7">
                   {user ? (
                     <>
                       <div className="flex items-center gap-4 mb-3">
                         <Avatar />
                         <div>
                           <div className="font-bold text-lg text-white">{profile?.username || user?.email}</div>
                           <div className="text-xs text-gray-400">{user?.email}</div>
                         </div>
                       </div>
                       <Link href="/profile" onClick={() => setOpen(false)} className="block py-2 px-3 rounded-lg bg-[#23244a]/60 hover:bg-[#6c63ff]/20 text-white font-semibold mb-2">โปรไฟล์ของฉัน</Link>
                       <button
                         className="w-full text-left py-2 px-3 rounded-lg bg-[#23244a]/60 hover:bg-[#ff4d6d]/20 text-[#ff4d6d] font-bold transition"
                         onClick={() => { signOut(); setOpen(false); }}
                       >ออกจากระบบ</button>
                     </>
                   ) : (
                     <Link href="/auth" onClick={() => setOpen(false)} className="block py-2 px-3 rounded-lg bg-[#23244a]/60 hover:bg-[#6c63ff]/20 text-white font-semibold">เข้าสู่ระบบ / สมัครสมาชิก</Link>
                   )}
                 </div>
                 <div className="mt-4 px-7 pb-7">
                   <div className="mb-2 font-semibold text-white">ภาษา (Language)</div>
                   <div className="flex gap-3">
                     {languages.map(l => (
                       <button
                         key={l.code}
                         className={`px-4 py-1.5 rounded-lg border text-base font-bold transition ${lang === l.code ? "bg-[#7c6cff] text-white border-[#7c6cff] shadow" : "bg-[#23244a] text-white border-[#23244a] hover:bg-[#393a6e]"}`}
                         onClick={() => handleLangChange(l.code)}
                       >
                         {l.label}
                       </button>
                     ))}
                   </div>
                 </div>
                 <div className="px-7 pb-5 text-xs text-[#b5baff] mt-4">
                   <Link href="/about" onClick={() => setOpen(false)} className="hover:underline">เกี่ยวกับ</Link> · <Link href="/howto" onClick={() => setOpen(false)} className="hover:underline">วิธีเล่น</Link> · <Link href="/contact" onClick={() => setOpen(false)} className="hover:underline">ติดต่อ</Link>
                 </div>
               </nav>
             </>
           )}
    </>
  );
}
