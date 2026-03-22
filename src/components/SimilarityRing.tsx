'use client'
import { useEffect, useRef } from 'react'

interface Props {
  score: number
  size?: number
}

export default function SimilarityRing({ score, size = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const S = canvas.width
    const cx = S / 2, cy = S / 2, r = S / 2 - 10
    let prog = 0
    let raf: number

    const animate = () => {
      ctx.clearRect(0, 0, S, S)
      prog = Math.min(prog + 0.018, score / 100)

      // BG ring
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 9
      ctx.stroke()

      // Score arc
      const hue = prog * 120
      ctx.beginPath()
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog)
      ctx.strokeStyle = `hsl(${hue}, 90%, 62%)`
      ctx.lineWidth = 9
      ctx.lineCap = 'round'
      ctx.shadowColor = `hsl(${hue}, 90%, 62%)`
      ctx.shadowBlur = 18
      ctx.stroke()
      ctx.shadowBlur = 0

      // Label
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${S * 0.17}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${Math.round(prog * 100)}%`, cx, cy - S * 0.08)

      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = `${S * 0.08}px monospace`
      ctx.fillText('MATCH', cx, cy + S * 0.1)

      if (prog < score / 100) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [score])

  return <canvas ref={canvasRef} width={size} height={size} />
}
