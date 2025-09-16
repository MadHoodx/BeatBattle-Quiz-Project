import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation';
import { createProfile } from '@/lib/profile'

export default function Auth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailValid, setEmailValid] = useState<boolean | null>(null)

  const validateEmail = (value: string) => {
    // Simple, practical email regex (covers most common cases)
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // Client-side email validation
    if (!validateEmail(email)) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง');
      setEmailValid(false);
      setLoading(false);
      return;
    }
    setEmailValid(true);
    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        // Best-effort: ask server to upsert profile row using service-role (avoids RLS issues)
        try {
          const { data: userData } = await supabase.auth.getUser();
          const createdUser = userData?.user;
          if (createdUser) {
            await fetch('/api/profiles/upsert', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ id: createdUser.id, username: '', casual_high_score: 0 })
            });
          }
        } catch (e) {
          console.warn('Failed to request server upsert for profile after signUp', e);
        }
        // Redirect new users to set a username
        try {
          const lang = (typeof document !== 'undefined' && document.cookie.match(/(?:(?:^|.*;\s*)lang\s*\=\s*([^;]*).*$)/)?.[1]) || 'en';
          router.push(`/${lang}/username`);
        } catch (e) { /* ignore */ }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error: any) {
      // Prefer the explicit message from Supabase, fallback to generic
      setError(error?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ ลองอีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
        <h1 className="text-2xl font-bold text-center text-white">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        
        {error && (
          <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              onBlur={(e) => setEmailValid(validateEmail(e.target.value))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white 
                focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent
                placeholder:text-white/30"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white 
                focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent
                placeholder:text-white/30"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white 
              rounded-xl font-medium transition-all hover:from-purple-600 hover:to-pink-600 
              focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full py-3 px-4 bg-white/5 border border-white/10 text-white/70 
              rounded-xl font-medium transition-all hover:bg-white/10 hover:text-white"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </form>
      </div>
    </div>
  )
}
