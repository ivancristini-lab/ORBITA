"use client"
import { useEffect, useRef } from "react"

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mx = -100, my = -100, rx = -100, ry = -100
    let rafId: number

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    const onEnter = () => { dotRef.current?.classList.add("hover"); ringRef.current?.classList.add("hover") }
    const onLeave = () => { dotRef.current?.classList.remove("hover"); ringRef.current?.classList.remove("hover") }

    window.addEventListener("mousemove", onMove)
    document.querySelectorAll("a,button,[role=button]").forEach(el => { el.addEventListener("mouseenter", onEnter); el.addEventListener("mouseleave", onLeave) })

    function animate() {
      if (dotRef.current) { dotRef.current.style.left = mx + "px"; dotRef.current.style.top = my + "px" }
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12
      if (ringRef.current) { ringRef.current.style.left = rx + "px"; ringRef.current.style.top = ry + "px" }
      rafId = requestAnimationFrame(animate)
    }
    animate()
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafId) }
  }, [])

  return (
    <>
      <div ref={dotRef} className="custom-cursor" />
      <div ref={ringRef} className="custom-cursor-ring" />
    </>
  )
}
