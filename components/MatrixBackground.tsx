"use client"
import { useEffect, useRef } from "react"

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let W = window.innerWidth, H = window.innerHeight
    canvas.width = W; canvas.height = H

    // Neural network nodes
    const NODE_COUNT = 60
    interface Node { x: number; y: number; vx: number; vy: number; r: number; pulse: number; pulseSpeed: number }
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1, pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    }))

    // Matrix rain columns
    const fontSize = 11
    const cols = Math.floor(W / fontSize)
    const drops = Array.from({ length: cols }, () => Math.random() * H / fontSize)
    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF"

    let frame = 0

    function draw() {
      frame++
      const isDark = !document.documentElement.getAttribute("data-theme") || document.documentElement.getAttribute("data-theme") === "dark"
      const bg = isDark ? "rgba(2,4,8,0.04)" : "rgba(238,242,252,0.06)"
      const nodeColor = isDark ? "rgba(0,212,255," : "rgba(0,119,204,"
      const lineColor = isDark ? "rgba(0,212,255," : "rgba(0,119,204,"
      const matrixColor = isDark ? "rgba(0,212,255," : "rgba(0,100,180,"
      const matrixBright = isDark ? "#00d4ff" : "#0066cc"

      // Fade background
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Matrix rain
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`
      for (let i = 0; i < cols; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const y = drops[i] * fontSize
        // Bright leading char
        ctx.fillStyle = matrixBright
        ctx.globalAlpha = 0.6
        ctx.fillText(char, i * fontSize, y)
        // Trail
        ctx.fillStyle = matrixColor + "0.15)"
        ctx.globalAlpha = 0.15
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, y - fontSize)
        ctx.globalAlpha = 1
        if (y > H && Math.random() > 0.975) drops[i] = 0
        drops[i] += 0.25
      }

      // Update & draw nodes
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += n.pulseSpeed
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
        const alpha = 0.4 + Math.sin(n.pulse) * 0.3
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r + Math.sin(n.pulse) * 0.8, 0, Math.PI * 2)
        ctx.fillStyle = nodeColor + alpha + ")"
        ctx.shadowBlur = 8; ctx.shadowColor = nodeColor + "0.5)"
        ctx.fill(); ctx.shadowBlur = 0
      })

      // Draw edges between close nodes
      ctx.shadowBlur = 0
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.12
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = lineColor + alpha + ")"
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // Occasional bright data pulse lines
      if (frame % 90 === 0) {
        const n1 = nodes[Math.floor(Math.random() * nodes.length)]
        const n2 = nodes[Math.floor(Math.random() * nodes.length)]
        ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y)
        ctx.strokeStyle = nodeColor + "0.6)"; ctx.lineWidth = 1.5; ctx.stroke()
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight
      canvas.width = W; canvas.height = H
    }
    window.addEventListener("resize", onResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize) }
  }, [])

  return <canvas ref={canvasRef} className="matrix-canvas" />
}
