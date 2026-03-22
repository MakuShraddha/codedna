'use client'
import { useEffect, useRef, useCallback } from 'react'

interface Props {
  vector: number[] | null
  color: { primary: string; secondary: string; rgb: string }
  animating?: boolean
  label?: string
  height?: number
}

export default function DNACanvas({ vector, color, animating = false, label, height = 300 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const progressRef = useRef(0)

  const draw = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current
      if (!canvas || !vector) return
      const ctx = canvas.getContext('2d')!
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const cx = W / 2
      const amplitude = 36
      const frequency = 0.048
      const steps = Math.floor(H * progress)
      const nodeCount = 10

      // Backbone strands
      for (let strand = 0; strand < 2; strand++) {
        ctx.beginPath()
        ctx.strokeStyle = strand === 0 ? color.primary : color.secondary
        ctx.lineWidth = 2.5
        ctx.shadowColor = strand === 0 ? color.primary : color.secondary
        ctx.shadowBlur = 10
        for (let y = 0; y < steps; y++) {
          const phase = strand === 0 ? 0 : Math.PI
          const x = cx + amplitude * Math.sin(y * frequency + phase)
          if (y === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // Base-pair rungs
      const rungSpacing = H / (nodeCount + 1)
      for (let i = 0; i < nodeCount; i++) {
        const yPos = rungSpacing * (i + 1)
        if (yPos > steps) break

        const featureVal = vector[i] ?? 0
        const x1 = cx + amplitude * Math.sin(yPos * frequency)
        const x2 = cx + amplitude * Math.sin(yPos * frequency + Math.PI)

        // Rung
        ctx.beginPath()
        ctx.strokeStyle = `rgba(${color.rgb}, ${0.35 + featureVal * 0.65})`
        ctx.lineWidth = 1.5 + featureVal * 2
        ctx.moveTo(x1, yPos)
        ctx.lineTo(x2, yPos)
        ctx.stroke()

        // Nodes
        const r = 4 + featureVal * 5
        ;[x1, x2].forEach((nx, si) => {
          const grad = ctx.createRadialGradient(nx, yPos, 0, nx, yPos, r)
          grad.addColorStop(0, si === 0 ? color.primary : color.secondary)
          grad.addColorStop(1, 'transparent')
          ctx.beginPath()
          ctx.fillStyle = grad
          ctx.arc(nx, yPos, r, 0, Math.PI * 2)
          ctx.fill()

          ctx.beginPath()
          ctx.arc(nx, yPos, 3, 0, Math.PI * 2)
          ctx.fillStyle = si === 0 ? color.primary : color.secondary
          ctx.shadowColor = si === 0 ? color.primary : color.secondary
          ctx.shadowBlur = 12
          ctx.fill()
          ctx.shadowBlur = 0
        })
      }
    },
    [vector, color]
  )

  useEffect(() => {
    if (!vector) return
    cancelAnimationFrame(animRef.current)
    if (animating) {
      progressRef.current = 0
      const animate = () => {
        progressRef.current = Math.min(progressRef.current + 0.022, 1)
        draw(progressRef.current)
        if (progressRef.current < 1) animRef.current = requestAnimationFrame(animate)
      }
      animRef.current = requestAnimationFrame(animate)
    } else {
      draw(1)
    }
    return () => cancelAnimationFrame(animRef.current)
  }, [vector, animating, draw])

  if (!vector) {
    return (
      <div
        style={{ width: 110, height }}
        className="flex items-center justify-center border border-white/5 rounded-lg"
      >
        <span className="text-white/20 text-[10px] font-mono text-center leading-relaxed">
          Paste code<br />to generate
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} width={110} height={height} className="block" />
      {label && (
        <span className="text-[9px] font-mono tracking-[3px] uppercase opacity-60" style={{ color: color.primary }}>
          {label}
        </span>
      )}
    </div>
  )
}
