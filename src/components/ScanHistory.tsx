'use client'
import { useEffect, useState } from 'react'

interface Scan {
  id: string
  title?: string
  language_a: string
  language_b?: string
  similarity?: number
  label?: string
  is_comparison: boolean
  created_at: string
  fingerprint_a: string
  fingerprint_b?: string
}

interface Props {
  sessionId: string
  userId?: string
  refreshTrigger: number
}

export default function ScanHistory({ sessionId, userId, refreshTrigger }: Props) {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const url = userId
          ? '/api/scans'
          : `/api/scans?sessionId=${sessionId}`
        const res = await fetch(url)
        const data = await res.json()
        setScans(data.scans || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId, userId, refreshTrigger])

  const handleDelete = async (id: string) => {
    await fetch('/api/scans', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } })
    setScans((s) => s.filter((x) => x.id !== id))
  }

  const scoreColor = (s?: number) =>
    !s ? '#888' : s >= 75 ? '#00ff88' : s >= 45 ? '#ffcc00' : '#ff4444'

  if (scans.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <div className="text-2xl opacity-30">🧬</div>
        <p className="text-white/20 text-[10px] font-mono text-center tracking-widest uppercase">
          No scans yet
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {loading && (
        <div className="text-white/20 text-[10px] font-mono text-center py-4 tracking-widest">Loading...</div>
      )}
      {scans.map((scan) => (
        <div
          key={scan.id}
          className="bg-white/[0.03] border border-white/8 rounded-lg p-3 hover:border-white/15 transition-all group"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono text-[#00d4ff]/70 tracking-wider">
                  {scan.language_a}
                </span>
                {scan.is_comparison && scan.language_b && (
                  <>
                    <span className="text-white/20 text-[9px]">vs</span>
                    <span className="text-[9px] font-mono text-[#ff6ec7]/70 tracking-wider">
                      {scan.language_b}
                    </span>
                  </>
                )}
              </div>

              {scan.is_comparison && scan.similarity !== undefined && (
                <div className="flex items-center gap-2">
                  <div
                    className="text-sm font-mono font-bold"
                    style={{ color: scoreColor(scan.similarity) }}
                  >
                    {scan.similarity}%
                  </div>
                  <div className="text-[9px] text-white/30 font-mono">{scan.label}</div>
                </div>
              )}

              {/* Fingerprint preview */}
              <div className="mt-1 text-[8px] font-mono text-white/15 tracking-wider truncate">
                {scan.fingerprint_a}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-[8px] text-white/20 font-mono">
                {new Date(scan.created_at).toLocaleDateString()}
              </div>
              {userId && (
                <button
                  onClick={() => handleDelete(scan.id)}
                  className="text-white/10 hover:text-red-400 text-[10px] transition-colors opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
