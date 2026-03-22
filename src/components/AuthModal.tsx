'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onClose: () => void
}

export default function AuthModal({ onClose }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onClose()
        window.location.reload()
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a1a] border border-white/10 rounded-2xl p-8 w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-mono text-lg tracking-wider">🧬 CodeDNA</h2>
            <p className="text-white/40 text-xs font-mono mt-1 tracking-widest uppercase">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xl">✕</button>
        </div>

        <div className="flex gap-2 mb-6">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all ${
                mode === m
                  ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                  : 'text-white/30 border border-white/8 hover:border-white/20'
              }`}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm font-mono placeholder-white/20 outline-none focus:border-[#00d4ff]/40"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm font-mono placeholder-white/20 outline-none focus:border-[#00d4ff]/40"
          />

          {message && (
            <p className={`text-xs font-mono ${message.includes('Check') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}

          <button
            onClick={handleAuth}
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[#00d4ff]/20 to-[#0066ff]/20 border border-[#00d4ff]/30 text-[#00d4ff] font-mono text-sm tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:from-[#00d4ff]/30 transition-all"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <p className="text-white/20 text-[10px] font-mono text-center mt-4">
          Save your scan history across devices
        </p>
      </div>
    </div>
  )
}
