import type { ContactWithInsight } from "./types"
export const trustSignal = (s: number) => Math.round(Math.min(100, Math.max(0, s ?? 30)))
export const recencySignal = (d: number) => Math.round(Math.max(5, 100 - d * 1.6))
export const oppSignal = (t: string | null | undefined) => t === "opportunity" ? 92 : t === "priority" ? 78 : t === "warning" ? 55 : 25
export function scoreClass(s: number): string {
  return s >= 80 ? "score-hot" : s >= 65 ? "score-gold" : s >= 45 ? "score-ok" : "score-low"
}
export function rowPriorityClass(c: ContactWithInsight): string {
  const t = c.latestInsight?.type; const s = c.latestInsight?.score ?? 0
  if (s >= 80 || t === "warning") return "prio-critical"
  if (t === "opportunity") return "prio-high"
  if (t === "priority" || s >= 60) return "prio-med"
  return ""
}
export function computeHealthScore(contacts: ContactWithInsight[]) {
  if (!contacts.length) return { score: 0, delta: 0, color: "var(--sub)" }
  const wi = contacts.filter(c => c.latestInsight)
  const avg = wi.length ? wi.reduce((s,c) => s + (c.latestInsight?.score ?? 0), 0) / wi.length : 0
  const rec = contacts.reduce((s,c) => s + recencySignal(c.daysSinceContact), 0) / contacts.length
  const cov = (wi.length / contacts.length) * 100
  const h = Math.round(avg * 0.45 + rec * 0.35 + cov * 0.20)
  const score = Math.min(99, Math.max(12, h))
  const color = score >= 75 ? "var(--safe)" : score >= 55 ? "var(--amber)" : "var(--pulse)"
  return { score, delta: 0, color }
}
