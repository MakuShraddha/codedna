'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { CodeFeatures, CompareResult } from '@/lib/dna'
import ScanHistory from '@/components/ScanHistory'
import AuthModal from '@/components/AuthModal'
import FeatureBars from '@/components/FeatureBars'

const DNACanvas = dynamic(() => import('@/components/DNACanvas'), { ssr: false })
const SimilarityRing = dynamic(() => import('@/components/SimilarityRing'), { ssr: false })

const COLORS = {
  A: { primary: '#00d4ff', secondary: '#0066ff', rgb: '0, 212, 255' },
  B: { primary: '#ff6ec7', secondary: '#ff2d78', rgb: '255, 110, 199' },
}

const SAMPLES = {
  'Python Sort': `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 10, 1, 2, 1]))`,

  'JS Async': `async function fetchUser(id) {
  try {
    const res = await fetch(\`/api/users/\${id}\`)
    if (!res.ok) throw new Error('Failed')
    const data = await res.json()
    return { ok: true, user: data }
  } catch (err) {
    console.error(err)
    return { ok: false }
  }
}`,

  'CSS Styles': `.card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: #1a1a2e;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  transition: transform 0.2s ease;
}
.card:hover { transform: translateY(-4px); }`,
}

// Session ID for anonymous users
function getSessionId() {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('codedna_session')
  if (!id) { id = Math.random().toString(36).slice(2); localStorage.setItem('codedna_session', id) }
  return id
}

export default function HomePage() {
  const [codeA, setCodeA] = useState('')
  const [codeB, setCodeB] = useState('')
  const [featA, setFeatA] = useState<CodeFeatures | null>(null)
  const [featB, setFeatB] = useState<CodeFeatures | null>(null)
  const [result, setResult] = useState<CompareResult | null>(null)
  const [animA, setAnimA] = useState(false)
  const [animB, setAnimB] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'compare' | 'single'>('compare')
  const [showHistory, setShowHistory] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [user, setUser] = useState<{ email: string; id: string } | null>(null)
  const [sessionId] = useState(getSessionId)
  const [historyTrigger, setHistoryTrigger] = useState(0)
  const [error, setError] = useState('')

  // Check auth on load
  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const sb = createClient()
      sb.auth.getUser().then(({ data }) => {
        if (data.user) setUser({ email: data.user.email!, id: data.user.id })
      })
      sb.auth.onAuthStateChange((_, session) => {
        if (session?.user) setUser({ email: session.user.email!, id: session.user.id })
        else setUser(null)
      })
    })
  }, [])

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    await createClient().auth.signOut()
    setUser(null)
  }

  const triggerAnim = (strand: 'A' | 'B') => {
    if (strand === 'A') { setAnimA(true); setTimeout(() => setAnimA(false), 2200) }
    else { setAnimB(true); setTimeout(() => setAnimB(false), 2200) }
  }

  const analyzeOne = useCallback(async () => {
    if (!codeA.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeA, sessionId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFeatA(data.features)
      triggerAnim('A')
      setHistoryTrigger((n) => n + 1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [codeA, sessionId])

  const compareTwo = useCallback(async () => {
    if (!codeA.trim() || !codeB.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeA, codeB, sessionId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFeatA(data.featA)
      setFeatB(data.featB)
      setResult(data.result)
      triggerAnim('A'); triggerAnim('B')
      setHistoryTrigger((n) => n + 1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [codeA, codeB, sessionId])

  const scoreColor =
    !result ? '#888' :
    result.score >= 75 ? '#00ff88' :
    result.score >= 45 ? '#ffcc00' : '#ff4444'

  return (
    <div className="min-h-screen bg-[#050510] text-white font-mono" style={{ backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(0,212,255,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255,110,199,0.04) 0%, transparent 60%)' }}>

      {/* ── Header ── */}
      <header className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00d4ff]/20 to-[#0066ff]/10 border border-[#00d4ff]/20 flex items-center justify-center text-lg">🧬</div>
          <div>
            <div className="text-[#00d4ff] font-bold tracking-[4px] text-sm">CodeDNA</div>
            <div className="text-white/25 text-[8px] tracking-[2px] uppercase">Code Fingerprint Analyzer</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.08] rounded-lg p-1">
            {(['compare', 'single'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded text-[9px] tracking-widest uppercase transition-all ${
                  mode === m
                    ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/20'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {m === 'compare' ? '⇄ Compare' : '◈ Single'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 rounded-lg text-[9px] tracking-widest uppercase border transition-all ${
              showHistory
                ? 'border-[#00d4ff]/30 text-[#00d4ff] bg-[#00d4ff]/10'
                : 'border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            ⊞ History
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-[9px] tracking-wider hidden sm:block truncate max-w-[120px]">{user.email}</span>
              <button onClick={handleSignOut} className="px-3 py-1.5 rounded-lg text-[9px] tracking-widest uppercase border border-white/10 text-white/40 hover:border-red-400/30 hover:text-red-400 transition-all">
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="px-3 py-1.5 rounded-lg text-[9px] tracking-widest uppercase border border-[#00d4ff]/20 text-[#00d4ff]/70 hover:bg-[#00d4ff]/10 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <div className="flex">
        {/* ── Main content ── */}
        <main className="flex-1 p-5 min-w-0">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          <div className={`grid gap-4 ${mode === 'compare' ? 'grid-cols-[1fr_auto_1fr]' : 'grid-cols-[1fr_auto_1fr]'}`}>

            {/* ── Code A panel ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
                  <span className="text-[10px] text-[#00d4ff] tracking-[3px] uppercase">Strand A</span>
                  {featA && (
                    <span className="text-[8px] bg-[#00d4ff]/10 px-2 py-0.5 rounded text-[#00d4ff]/60 tracking-wider">
                      {featA.language} · {featA.lines} lines · {featA.complexity} complexity
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {Object.keys(SAMPLES).map((k) => (
                    <button
                      key={k}
                      onClick={() => { setCodeA(SAMPLES[k as keyof typeof SAMPLES]); setFeatA(null); setResult(null) }}
                      className="text-[8px] px-2 py-1 rounded border border-[#00d4ff]/15 text-[#00d4ff]/40 hover:border-[#00d4ff]/40 hover:text-[#00d4ff]/70 transition-all tracking-wider"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={codeA}
                onChange={(e) => { setCodeA(e.target.value); setFeatA(null); setResult(null) }}
                placeholder="Paste your code here..."
                className="w-full h-52 resize-y bg-[#00d4ff]/[0.02] border border-[#00d4ff]/15 rounded-xl text-[#cce8ff] text-xs leading-relaxed p-4 outline-none focus:border-[#00d4ff]/35 placeholder-white/15 transition-colors"
              />

              {mode === 'single' ? (
                <button
                  onClick={analyzeOne}
                  disabled={!codeA.trim() || loading}
                  className="py-2.5 rounded-xl border border-[#00d4ff]/20 bg-[#00d4ff]/[0.06] text-[#00d4ff] text-[10px] tracking-[3px] uppercase disabled:opacity-25 disabled:cursor-not-allowed hover:bg-[#00d4ff]/10 transition-all"
                >
                  {loading ? '◈ Analyzing...' : '◈ Generate Strand A'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    import('@/lib/dna').then(({ extractFeatures }) => {
                      const f = extractFeatures(codeA)
                      setFeatA(f); if (f) triggerAnim('A')
                    })
                  }}
                  disabled={!codeA.trim()}
                  className="py-2 rounded-xl border border-[#00d4ff]/15 text-[#00d4ff]/60 text-[9px] tracking-[3px] uppercase disabled:opacity-25 disabled:cursor-not-allowed hover:border-[#00d4ff]/30 transition-all"
                >
                  Preview A
                </button>
              )}

              {featA && (
                <div className="bg-black/30 rounded-xl p-3 border border-white/[0.05]">
                  <div className="text-[8px] text-white/25 tracking-[3px] uppercase mb-3">Feature Vector A</div>
                  <FeatureBars vectorA={featA.vector} vectorB={featB?.vector} />
                  <div className="mt-3 text-[8px] text-white/15 font-mono tracking-wider">
                    Fingerprint: <span className="text-[#00d4ff]/30">{featA.fingerprint}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Center: DNA + Score ── */}
            <div className="flex flex-col items-center gap-4 pt-7 min-w-[160px]">
              <div className="flex gap-3 items-end">
                <DNACanvas vector={featA?.vector ?? null} color={COLORS.A} animating={animA} label="A" />
                {mode === 'compare' && (
                  <DNACanvas vector={featB?.vector ?? null} color={COLORS.B} animating={animB} label="B" />
                )}
              </div>

              {mode === 'compare' && (
                <button
                  onClick={compareTwo}
                  disabled={!codeA.trim() || !codeB.trim() || loading}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-white/60 text-[9px] tracking-[3px] uppercase disabled:opacity-20 disabled:cursor-not-allowed hover:border-white/30 hover:text-white/80 transition-all whitespace-nowrap bg-white/[0.03]"
                >
                  {loading ? '◈ Scanning...' : '⇄ Compare'}
                </button>
              )}

              {result && (
                <div className="flex flex-col items-center gap-2">
                  <SimilarityRing score={result.score} />
                  <div className="text-[9px] tracking-[2px] text-center" style={{ color: scoreColor }}>
                    {result.label}
                  </div>
                  <div className="text-[8px] text-white/25 tracking-wider uppercase">Cosine Similarity</div>
                </div>
              )}

              {!result && (featA || featB) && (
                <div className="text-center">
                  <div className="text-[8px] text-white/20 tracking-wider mb-1">FINGERPRINT</div>
                  {featA && <div className="text-[7px] font-mono text-[#00d4ff]/25 break-all max-w-[130px]">{featA.fingerprint.slice(0, 10)}...</div>}
                </div>
              )}
            </div>

            {/* ── Code B panel (compare mode) or Analysis (single mode) ── */}
            {mode === 'compare' ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ff6ec7] shadow-[0_0_8px_#ff6ec7]" />
                    <span className="text-[10px] text-[#ff6ec7] tracking-[3px] uppercase">Strand B</span>
                    {featB && (
                      <span className="text-[8px] bg-[#ff6ec7]/10 px-2 py-0.5 rounded text-[#ff6ec7]/60 tracking-wider">
                        {featB.language} · {featB.lines} lines
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {Object.keys(SAMPLES).map((k) => (
                      <button
                        key={k}
                        onClick={() => { setCodeB(SAMPLES[k as keyof typeof SAMPLES]); setFeatB(null); setResult(null) }}
                        className="text-[8px] px-2 py-1 rounded border border-[#ff6ec7]/15 text-[#ff6ec7]/40 hover:border-[#ff6ec7]/40 hover:text-[#ff6ec7]/70 transition-all tracking-wider"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={codeB}
                  onChange={(e) => { setCodeB(e.target.value); setFeatB(null); setResult(null) }}
                  placeholder="Paste second code snippet..."
                  className="w-full h-52 resize-y bg-[#ff6ec7]/[0.02] border border-[#ff6ec7]/15 rounded-xl text-[#ffd6f0] text-xs leading-relaxed p-4 outline-none focus:border-[#ff6ec7]/35 placeholder-white/15 transition-colors"
                />

                <button
                  onClick={() => {
                    import('@/lib/dna').then(({ extractFeatures }) => {
                      const f = extractFeatures(codeB)
                      setFeatB(f); if (f) triggerAnim('B')
                    })
                  }}
                  disabled={!codeB.trim()}
                  className="py-2 rounded-xl border border-[#ff6ec7]/15 text-[#ff6ec7]/60 text-[9px] tracking-[3px] uppercase disabled:opacity-25 disabled:cursor-not-allowed hover:border-[#ff6ec7]/30 transition-all"
                >
                  Preview B
                </button>

                {featB && (
                  <div className="bg-black/30 rounded-xl p-3 border border-white/[0.05]">
                    <div className="text-[8px] text-white/25 tracking-[3px] uppercase mb-3">Feature Vector B</div>
                    <FeatureBars vectorA={featB.vector} vectorB={featA?.vector} colorA="#ff6ec7" colorB="#00d4ff" />
                    <div className="mt-3 text-[8px] text-white/15 font-mono tracking-wider">
                      Fingerprint: <span className="text-[#ff6ec7]/30">{featB.fingerprint}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Single mode analysis panel */
              <div className="flex flex-col gap-3 pt-7">
                <div className="text-[10px] text-white/30 tracking-[3px] uppercase">Analysis</div>
                {featA ? (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Language', value: featA.language },
                        { label: 'Lines', value: `${featA.lines}` },
                        { label: 'Complexity', value: featA.complexity },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-center">
                          <div className="text-[8px] text-white/25 tracking-wider uppercase mb-1">{label}</div>
                          <div className="text-xs text-[#00d4ff]/80 font-mono">{value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-black/30 rounded-xl p-3 border border-white/[0.05]">
                      <div className="text-[8px] text-white/25 tracking-[3px] uppercase mb-3">Full Breakdown</div>
                      <FeatureBars vectorA={featA.vector} />
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                      <div className="text-[8px] text-white/25 tracking-wider uppercase mb-2">DNA Fingerprint</div>
                      <div className="text-[10px] font-mono text-[#00d4ff]/40 break-all tracking-widest">
                        {featA.fingerprint}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="text-4xl opacity-10">🧬</div>
                    <div className="text-white/15 text-[10px] tracking-widest text-center uppercase">
                      Generate Strand A<br />to see analysis
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Breakdown table ── */}
          {result && (
            <div className="mt-5 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
              <div className="text-[9px] text-white/30 tracking-[3px] uppercase mb-4">Feature Breakdown</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {result.breakdown.map(({ feature, a, b, diff }) => (
                  <div key={feature} className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.05]">
                    <div className="text-[7px] text-white/25 uppercase tracking-wider mb-2">{feature}</div>
                    <div className="flex justify-between text-[9px] font-mono mb-1.5">
                      <span className="text-[#00d4ff]/70">A: {(a * 100).toFixed(0)}</span>
                      <span className="text-[#ff6ec7]/70">B: {(b * 100).toFixed(0)}</span>
                    </div>
                    <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(1 - diff) * 100}%`,
                          background: diff < 0.2 ? '#00ff8888' : diff < 0.4 ? '#ffcc0088' : '#ff444488',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Pipeline explainer ── */}
          <div className="mt-5 bg-[#00d4ff]/[0.02] border border-[#00d4ff]/[0.07] rounded-xl p-4">
            <div className="text-[8px] text-white/25 tracking-[3px] uppercase mb-3">How It Works</div>
            <div className="flex gap-1 items-center flex-wrap">
              {['Code Input', 'AST Parse', 'Feature Extraction', 'Vector [0.8, 0.3…]', 'DNA Visual', 'Cosine Similarity'].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-1">
                  <div className="bg-[#00d4ff]/[0.08] border border-[#00d4ff]/15 rounded px-2.5 py-1.5 text-[8px] text-[#00d4ff]/60 tracking-wider whitespace-nowrap">
                    {step}
                  </div>
                  {i < arr.length - 1 && <span className="text-[#00d4ff]/20 text-[9px]">→</span>}
                </div>
              ))}
            </div>
            <p className="text-[8px] text-white/15 mt-2 leading-relaxed">
              Features: function density · loop complexity · nesting depth · comment ratio · operator frequency · naming style · string usage · cyclomatic complexity · line length · numeric density
            </p>
          </div>
        </main>

        {/* ── History sidebar ── */}
        {showHistory && (
          <aside className="w-72 border-l border-white/[0.06] p-4 flex-shrink-0 overflow-y-auto max-h-screen sticky top-[61px]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[9px] text-white/30 tracking-[3px] uppercase">Scan History</div>
              {!user && (
                <button
                  onClick={() => setShowAuth(true)}
                  className="text-[8px] text-[#00d4ff]/50 hover:text-[#00d4ff]/80 transition-colors tracking-wider"
                >
                  Sign in to save →
                </button>
              )}
            </div>
            <ScanHistory sessionId={sessionId} userId={user?.id} refreshTrigger={historyTrigger} />
          </aside>
        )}
      </div>

      {/* ── Auth modal ── */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
