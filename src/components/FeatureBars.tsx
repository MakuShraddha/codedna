'use client'
import { FEATURE_LABELS } from '@/lib/dna'

interface Props {
  vectorA: number[]
  vectorB?: number[] | null
  colorA?: string
  colorB?: string
}

export default function FeatureBars({ vectorA, vectorB, colorA = '#00d4ff', colorB = '#ff6ec7' }: Props) {
  return (
    <div className="flex flex-col gap-[6px]">
      {FEATURE_LABELS.map((label, i) => {
        const a = vectorA[i] ?? 0
        const b = vectorB ? (vectorB[i] ?? 0) : null
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="w-[96px] text-[8px] text-white/35 font-mono text-right flex-shrink-0 tracking-wide uppercase">
              {label}
            </div>
            <div className="flex-1 h-[5px] bg-white/5 rounded-full relative overflow-hidden">
              {/* A bar */}
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                style={{
                  width: `${a * 100}%`,
                  background: `linear-gradient(90deg, ${colorA}aa, ${colorA})`,
                  boxShadow: `0 0 6px ${colorA}55`,
                }}
              />
              {/* B overlay */}
              {b !== null && (
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${b * 100}%`,
                    background: `${colorB}44`,
                    border: `1px solid ${colorB}88`,
                  }}
                />
              )}
            </div>
            <div className="w-6 text-[8px] font-mono text-white/25 text-right">{(a * 100).toFixed(0)}</div>
          </div>
        )
      })}
    </div>
  )
}
