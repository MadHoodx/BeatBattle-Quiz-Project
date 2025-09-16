"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/context/I18nContext';

export default function MultiplayerPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [category, setCategory] = React.useState('kpop');

  const createRoom = async () => {
    setCreating(true);
    const res = await fetch('/api/rooms', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ category, num: 5 }) });
    const json = await res.json();
    setCreating(false);
    if (json?.success && json.roomId) {
      // Save questions temporarily so host can seed the room page without extra server state
      try { sessionStorage.setItem(`room:${json.roomId}:questions`, JSON.stringify(json.questions || [])); } catch (e) {}
      router.push(`/${'en'}/multiplayer/${json.roomId}`);
    } else {
      alert('Failed to create room');
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#070a18] text-white">
      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-10 py-20">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-fuchsia-50 to-pink-200 mb-4">{t('multiplayer')}</h1>
        <div className="rounded-2xl bg-[#0f1724]/60 border border-white/6 p-6">
          <label className="block mb-2">Category</label>
          <select value={category} onChange={e=>setCategory(e.target.value)} className="mb-4 p-2 rounded-md bg-[#0b1220] w-full">
            <option value="kpop">K-Pop</option>
            <option value="pop">Pop</option>
          </select>
          <div className="flex gap-3">
            <button onClick={createRoom} className="px-4 py-2 rounded-md bg-fuchsia-500 text-black font-semibold" disabled={creating}>{creating? 'Creating...':'Create room'}</button>
            <button onClick={()=>router.push('/')} className="px-4 py-2 rounded-md border border-white/10">Back</button>
          </div>
        </div>
      </div>
    </main>
  );
}
