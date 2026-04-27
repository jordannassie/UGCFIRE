'use client'
import { useRef, useEffect, useState, type CSSProperties } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number     // 0 → dead, 1 → fresh
  decay: number
  size: number
}

interface FireButtonProps {
  href: string
  children: React.ReactNode
  className?: string
  style?: CSSProperties
  target?: string
  rel?: string
  onClick?: () => void
}

export default function FireButton({ href, children, className, style, target, rel, onClick }: FireButtonProps) {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const rafRef    = useRef<number | null>(null)
  const hovering  = useRef(false)
  const [active, setActive] = useState(false)

  function spawnParticle(w: number, h: number) {
    const margin = w * 0.15
    particles.current.push({
      x:     margin + Math.random() * (w - margin * 2),
      y:     h + 4,
      vx:    (Math.random() - 0.5) * 1.2,
      vy:    -(1.4 + Math.random() * 2.2),
      life:  1,
      decay: 0.012 + Math.random() * 0.016,
      size:  6 + Math.random() * 10,
    })
  }

  function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    const t = p.life
    let r: number, g: number, b: number, a: number

    if (t > 0.65) {
      const f = (t - 0.65) / 0.35
      r = 255; g = Math.round(220 * f + 140 * (1 - f)); b = Math.round(80 * f); a = t * 0.95
    } else if (t > 0.3) {
      const f = (t - 0.3) / 0.35
      r = 255; g = Math.round(140 * f + 60 * (1 - f)); b = 0; a = t * 0.9
    } else {
      r = 255; g = Math.round(60 + 30 * t); b = 0; a = t * 0.75
    }

    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
    grad.addColorStop(0,   `rgba(${r},${g},${b},${a.toFixed(2)})`)
    grad.addColorStop(0.4, `rgba(255,${Math.round(g * 0.7)},0,${(a * 0.6).toFixed(2)})`)
    grad.addColorStop(1,   `rgba(255,80,0,0)`)

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap   = wrapRef.current
    if (!canvas || !wrap) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas || !wrap) return
      canvas.width  = wrap.offsetWidth
      canvas.height = wrap.offsetHeight + 60  // extra headroom for flames
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    let lastTime = 0
    function loop(ts: number) {
      if (!canvas || !ctx) return
      const dt = Math.min(ts - lastTime, 32)
      lastTime = ts

      const w = canvas.width
      const h = canvas.offsetHeight ?? canvas.height
      const buttonH = wrap?.offsetHeight ?? 48

      ctx.clearRect(0, 0, w, canvas.height)

      // Spawn new particles only while hovering
      if (hovering.current) {
        const rate = Math.ceil(dt / 16)
        for (let i = 0; i < rate; i++) spawnParticle(w, buttonH + 4)
      }

      // Update + draw
      particles.current = particles.current.filter(p => p.life > 0)
      for (const p of particles.current) {
        p.x    += p.vx * (dt / 16)
        p.y    += p.vy * (dt / 16)
        p.vy   *= 0.987
        p.vx   += (Math.random() - 0.5) * 0.18
        p.life -= p.decay * (dt / 16)
        p.size *= 0.992
        drawParticle(ctx, p)
      }

      if (hovering.current || particles.current.length > 0) {
        rafRef.current = requestAnimationFrame(loop)
      } else {
        rafRef.current = null
        setActive(false)
      }
    }

    function startLoop() {
      if (rafRef.current === null) {
        lastTime = performance.now()
        rafRef.current = requestAnimationFrame(loop)
      }
    }

    function onEnter() {
      hovering.current = true
      setActive(true)
      startLoop()
    }

    function onLeave() {
      hovering.current = false
    }

    wrap.addEventListener('mouseenter', onEnter)
    wrap.addEventListener('mouseleave', onLeave)

    return () => {
      wrap.removeEventListener('mouseenter', onEnter)
      wrap.removeEventListener('mouseleave', onLeave)
      ro.disconnect()
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {/* Flame canvas — sits above button via z-index but pointer-events:none */}
      <canvas
        ref={canvasRef}
        style={{
          position:      'absolute',
          left:          0,
          bottom:        0,
          width:         '100%',
          pointerEvents: 'none',
          zIndex:        10,
          opacity:       active ? 1 : 0,
          transition:    'opacity 0.15s',
        }}
      />
      <a
        href={href}
        target={target}
        rel={rel}
        className={className}
        style={style}
        onClick={onClick}
      >
        {children}
      </a>
    </div>
  )
}
