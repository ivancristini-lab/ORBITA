"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import type { ContactWithInsight, Insight, User } from "../lib/types"
import { computeHealthScore, rowPriorityClass, scoreClass } from "../lib/scoring"

const initials = (n: string) => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
const fmtDays  = (d: number) => d === 0 ? "Hoy" : d === 1 ? "Ayer" : `${d}d`
const avatarCls = (t?: string | null) =>
  t === "warning" ? "cr-av-warn" : t === "opportunity" ? "cr-av-opp" : t === "priority" ? "cr-av-prio" : "cr-av-none"
const insightTypeCls = (t?: string | null) =>
  t === "warning" ? "warn" : t === "opportunity" ? "opp" : "prio"
const insightTypeLabel = (t?: string | null) =>
  t === "warning" ? "Relación en riesgo" : t === "opportunity" ? "Oportunidad activa" : "Acción prioritaria"

// ── Floating insight card (dismissable) ──────────────────────
interface InsightCardProps {
  insight: Insight
  contactName: string
  contactId: string
  onDismiss: (id: string) => void
}
function InsightCard({ insight, contactName, contactId, onDismiss }: InsightCardProps) {
  const [dismissing, setDismissing] = useState(false)
  const cls = insightTypeCls(insight.type)

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDismissing(true)
    setTimeout(() => onDismiss(insight.id), 240)
  }

  return (
    <Link href={`/contacts/${contactId}`}
      className={`insight-float ${cls} ${dismissing ? "dismissing" : ""}`}
      style={{ display: "block", textDecoration: "none" }}>
      <button className="insight-float-dismiss" onClick={handleDismiss} title="Descartar">✕</button>
      <div className="insight-float-eyebrow">
        <span className="dot" />
        {insightTypeLabel(insight.type)}
      </div>
      <div className="insight-float-contact">{contactName}</div>
      <div className="insight-float-message">{insight.message}</div>
      <div className="insight-float-action">
        <span className="insight-float-action-arrow">→</span>
        <span>{insight.suggestedAction}</span>
      </div>
      <div className="insight-float-footer">
        <span className="insight-float-date">
          {new Date(insight.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
        </span>
        <span className="insight-float-score">Score {insight.score}</span>
      </div>
    </Link>
  )
}

// ── Contact row ───────────────────────────────────────────────
function ContactRow({ c }: { c: ContactWithInsight }) {
  const ins = c.latestInsight
  const score = ins?.score ?? 0
  return (
    <Link href={`/contacts/${c.id}`} className={`contact-row`}>
      <div className={`cr-avatar ${avatarCls(ins?.type)}`}>{initials(c.name)}</div>
      <div className="cr-body">
        <div className="cr-name">{c.name}</div>
        <div className="cr-role">{c.role}{c.company ? ` · ${c.company}` : ""}</div>
      </div>
      <div className="cr-right">
        {ins && <span className={`status-dot ${insightTypeCls(ins.type)}`} />}
        <span className="cr-days">{fmtDays(c.daysSinceContact)}</span>
        <span className={`cr-score ${scoreClass(score)}`}>{score || "—"}</span>
      </div>
    </Link>
  )
}

// ── Health Score ──────────────────────────────────────────────
function HealthWidget({ contacts }: { contacts: ContactWithInsight[] }) {
  const { score, color } = computeHealthScore(contacts)
  const r = 34, circ = 2 * Math.PI * r
  const atRisk = contacts.filter(c => c.latestInsight?.type === "warning").length
  const avgDays = contacts.length
    ? Math.round(contacts.reduce((s, c) => s + c.daysSinceContact, 0) / contacts.length)
    : 0
  return (
    <div className="health-widget">
      <div className="health-ring">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle className="hr-bg" cx="40" cy="40" r={r} strokeWidth="4" />
          <circle className="hr-fill" cx="40" cy="40" r={r} strokeWidth="4"
            stroke={color} strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} />
        </svg>
        <div className="health-center">
          <div className="health-value" style={{ color }}>{score}</div>
          <div className="health-of">/100</div>
        </div>
      </div>
      <div className="health-label">Network Health</div>
      <div className="health-grid" style={{ marginTop: 6 }}>
        {[
          { v: contacts.length, l: "Contactos", c: "var(--text)" },
          { v: atRisk,          l: "En riesgo",  c: atRisk > 0 ? "var(--red)" : "var(--green)" },
          { v: `${avgDays}d`,   l: "Prom. silencio", c: "var(--text2)" },
          { v: contacts.filter(c => (c.latestInsight?.score ?? 0) >= 75).length, l: "Alta prio.", c: "var(--orange)" },
        ].map((s, i) => (
          <div key={i} className="health-stat">
            <div className="health-stat-val" style={{ color: s.c }}>{s.v}</div>
            <div className="health-stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────
interface Toast { id: string; title: string; msg: string }
function ToastTray({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  if (!toasts.length) return null
  return (
    <div className="toast-tray">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <div className="toast-icon">✓</div>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            <div className="toast-msg">{t.msg}</div>
          </div>
          <button className="toast-close" onClick={() => onClose(t.id)}>×</button>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════
export default function Dashboard() {
  const router = useRouter()
  const [contacts,    setContacts]    = useState<ContactWithInsight[]>([])
  const [user,        setUser]        = useState<User | null>(null)
  const [aiMode,      setAiMode]      = useState("fallback")
  const [loading,     setLoading]     = useState(true)
  const [nav,         setNav]         = useState<"insights" | "contacts" | "alerts">("insights")
  const [searchQ,     setSearchQ]     = useState("")
  const [toasts,      setToasts]      = useState<Toast[]>([])
  const [theme,       setTheme]       = useState<"dark" | "light">("dark")
  const [pageError,   setPageError]   = useState("")
  const [editGoal,    setEditGoal]    = useState(false)
  const [goalDraft,   setGoalDraft]   = useState("")
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set())

  const closeToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), [])

  useEffect(() => {
    if (!localStorage.getItem("orbita_session")) { router.push("/auth"); return }
    const t = (localStorage.getItem("orbita_theme") as "dark"|"light") ?? "dark"
    setTheme(t)
    document.documentElement.setAttribute("data-theme", t)

    // Load dismissed insights from session
    const saved = sessionStorage.getItem("orbita_dismissed")
    if (saved) {
      try { setDismissedInsights(new Set(JSON.parse(saved))) } catch {}
    }

    Promise.all([
      fetch("/api/contacts").then(r => r.json()),
      fetch("/api/user").then(r => r.json()),
      fetch("/api/health").then(r => r.json()),
    ]).then(([cd, ud, hd]) => {
      const raw: ContactWithInsight[] = (cd as any).contacts ?? []
      setContacts(raw.sort((a, b) => (b.latestInsight?.score ?? 0) - (a.latestInsight?.score ?? 0)))
      setUser((ud as any).user ?? null)
      setAiMode((hd as any).aiMode ?? "fallback")
    }).catch(() => setPageError("Error cargando datos."))
    .finally(() => setLoading(false))
  }, [router])

  // Toast from session (after delete etc)
  useEffect(() => {
    const p = sessionStorage.getItem("orbita_toast")
    if (p) {
      try {
        const t = JSON.parse(p)
        const toast: Toast = { id: `t-${Date.now()}`, title: t.name ?? "Listo", msg: t.msg ?? "" }
        setToasts(x => [toast, ...x].slice(0, 3))
        setTimeout(() => closeToast(toast.id), 5000)
      } catch {}
      sessionStorage.removeItem("orbita_toast")
    }
  }, [closeToast])

  const toggleTheme = () => {
    const n = theme === "dark" ? "light" : "dark"
    setTheme(n)
    document.documentElement.setAttribute("data-theme", n)
    localStorage.setItem("orbita_theme", n)
    fetch("/api/user", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: n }) }).catch(() => {})
  }

  const saveGoal = async () => {
    if (!goalDraft.trim()) return
    const r = await fetch("/api/user", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal: goalDraft.trim() }) })
    const d = await r.json() as any
    if (d.user) { setUser(d.user); setEditGoal(false) }
  }

  const dismissInsight = (insightId: string) => {
    setDismissedInsights(prev => {
      const next = new Set([...prev, insightId])
      sessionStorage.setItem("orbita_dismissed", JSON.stringify([...next]))
      return next
    })
  }

  // Active insights (not dismissed)
  const activeInsights = contacts
    .filter(c => c.latestInsight && !dismissedInsights.has(c.latestInsight.id))
    .map(c => ({ contact: c, insight: c.latestInsight! }))
    .sort((a, b) => b.insight.score - a.insight.score)

  const warnings  = contacts.filter(c => c.latestInsight?.type === "warning")
  const filtered  = contacts.filter(c =>
    !searchQ || [c.name, c.role, c.company].join(" ").toLowerCase().includes(searchQ.toLowerCase()))

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span className="spinner" style={{ width: 20, height: 20 }} />
    </div>
  )

  return (
    <>
      <ToastTray toasts={toasts} onClose={closeToast} />
      <div className="app-shell">

        {/* ── TOPBAR ── */}
        <header className="topbar">
          <div className="topbar-logo">
            <img src="/logo.png" alt="Órbita" />
            <span className="logo-wordmark">Órbita</span>
          </div>

          <div className="topbar-search">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: "var(--text3)", flexShrink: 0 }}>
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input className="search-input" placeholder="Buscar contactos…"
              value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            <span className="search-kbd">⌘K</span>
          </div>

          <div className="topbar-right">
            <div className={`ai-pill ${aiMode !== "fallback" ? "on" : ""}`}>
              <span className="ai-pill-dot" />
              {aiMode === "gemini" ? "Gemini" : aiMode === "anthropic" ? "Claude" : aiMode === "openai" ? "GPT" : "Fallback"}
            </div>
            <button className="theme-btn" onClick={toggleTheme} title="Cambiar tema">
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <Link href="/contacts/new">
              <button className="btn btn-primary btn-sm">+ Contacto</button>
            </Link>
          </div>
        </header>

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <Link href="/contacts/new" style={{ display: "block" }}>
            <button className="new-contact-btn">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Nuevo contacto
            </button>
          </Link>

          <div className="nav-section">
            <div className="nav-section-title">Vistas</div>
            {([
              { id: "insights",  icon: "⚡", label: "Insights",   count: activeInsights.length },
              { id: "contacts",  icon: "◎",  label: "Contactos",  count: contacts.length },
              { id: "alerts",    icon: "◉",  label: "Alertas",    count: warnings.length, danger: true },
            ] as const).map(n => (
              <button key={n.id}
                className={`nav-link ${nav === n.id ? "active" : ""}`}
                onClick={() => setNav(n.id)}>
                <span className="nav-link-icon">{n.icon}</span>
                {n.label}
                {n.count > 0 && (
                  <span className={`nav-count ${n.danger && n.count > 0 ? "danger" : ""}`}>{n.count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Objetivo</div>
            {editGoal ? (
              <div className="stack" style={{ gap: 6 }}>
                <input className="input" style={{ fontSize: 12, padding: "6px 10px" }}
                  value={goalDraft} onChange={e => setGoalDraft(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveGoal()}
                  placeholder="Tu meta actual…" autoFocus />
                <div style={{ display: "flex", gap: 5 }}>
                  <button className="btn btn-primary btn-xs" onClick={saveGoal} style={{ flex: 1 }}>✓</button>
                  <button className="btn btn-ghost btn-xs" onClick={() => setEditGoal(false)}>✕</button>
                </div>
              </div>
            ) : (
              <div className="goal-widget" onClick={() => { setGoalDraft(user?.goal ?? ""); setEditGoal(true) }}>
                <div className="goal-widget-label">Meta activa</div>
                <div className="goal-widget-text">{user?.goal || "— Hacé clic para agregar"}</div>
              </div>
            )}
          </div>

          <div className="user-widget">
            {user && (
              <div className="user-row">
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>
            )}
            <button className="nav-link" style={{ color: "var(--text3)" }}
              onClick={() => { localStorage.removeItem("orbita_session"); router.push("/auth") }}>
              <span className="nav-link-icon">→</span>
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">
          <div className="main-scroll">
            {pageError && <div className="notice error" style={{ marginBottom: 16 }}>{pageError}</div>}

            {/* INSIGHTS VIEW */}
            {nav === "insights" && (
              <div className="fade-in">
                <div className="page-header">
                  <h1 className="page-title">Insights <em>activos</em></h1>
                  <p className="page-sub">
                    {activeInsights.length > 0
                      ? `${activeInsights.length} acción${activeInsights.length !== 1 ? "es" : ""} prioritaria${activeInsights.length !== 1 ? "s" : ""} — descartá las que ya resolviste`
                      : "Todos los insights descartados · Generá nuevos desde cada contacto"}
                  </p>
                </div>
                {activeInsights.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">⚡</span>
                    <strong>Sin insights pendientes</strong>
                    <span style={{ fontSize: 12 }}>Entrá a un contacto y generá un nuevo insight</span>
                    <Link href="/contacts/new" style={{ marginTop: 12 }}>
                      <button className="btn btn-ghost btn-sm">+ Agregar contacto</button>
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {activeInsights.map(({ contact, insight }) => (
                      <InsightCard key={insight.id}
                        insight={insight}
                        contactName={contact.name}
                        contactId={contact.id}
                        onDismiss={dismissInsight} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONTACTS VIEW */}
            {nav === "contacts" && (
              <div className="fade-in">
                <div className="page-header">
                  <h1 className="page-title">Contactos</h1>
                  <p className="page-sub">{contacts.length} en tu red</p>
                </div>
                {contacts.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">◎</span>
                    <strong>Sin contactos aún</strong>
                    <Link href="/contacts/new" style={{ marginTop: 12 }}>
                      <button className="btn btn-primary btn-sm">+ Primer contacto</button>
                    </Link>
                  </div>
                ) : (
                  <div className="contact-list">
                    {filtered.map(c => <ContactRow key={c.id} c={c} />)}
                    {filtered.length === 0 && searchQ && (
                      <div className="empty-state">
                        <strong>Sin resultados</strong>
                        <span style={{ fontSize: 12 }}>Nada para "{searchQ}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ALERTS VIEW */}
            {nav === "alerts" && (
              <div className="fade-in">
                <div className="page-header">
                  <h1 className="page-title">Alertas</h1>
                  <p className="page-sub">Relaciones que necesitan atención ahora</p>
                </div>
                {warnings.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">◉</span>
                    <strong>Sin alertas activas</strong>
                    <span style={{ fontSize: 12 }}>Tu red está al día</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {warnings.map(c => (
                      <Link key={c.id} href={`/contacts/${c.id}`} className="alert-item">
                        <div className="alert-dot" />
                        <div className="alert-body">
                          <div className="alert-name">{c.name}
                            <span style={{ fontWeight: 400, color: "var(--text3)", marginLeft: 6 }}>
                              {c.role} · {fmtDays(c.daysSinceContact)}
                            </span>
                          </div>
                          <div className="alert-msg">{c.latestInsight?.message}</div>
                          <div className="alert-cta">→ {c.latestInsight?.suggestedAction}</div>
                        </div>
                        <div className="alert-score">{c.latestInsight?.score}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ── ASIDE ── */}
        <aside className="aside">
          <div className="aside-section">
            <div className="aside-title">Red</div>
            <HealthWidget contacts={contacts} />
          </div>

          <div className="aside-section" style={{ flex: 1 }}>
            <div className="aside-title">Acciones recientes</div>
            {contacts.filter(c => c.latestInsight).slice(0, 5).map(c => (
              <Link key={c.id} href={`/contacts/${c.id}`} className="feed-item">
                <div className="feed-item-name">{c.name}</div>
                <div className="feed-item-action">
                  {c.latestInsight!.suggestedAction.split(" ").slice(0, 8).join(" ")}…
                </div>
              </Link>
            ))}
            {contacts.filter(c => c.latestInsight).length === 0 && (
              <div style={{ fontSize: 11.5, color: "var(--text3)" }}>Sin acciones todavía</div>
            )}
          </div>

          <div className="aside-section">
            <div className="aside-title">Motor IA</div>
            <div className={`ai-pill ${aiMode !== "fallback" ? "on" : ""}`} style={{ width: "100%", justifyContent: "flex-start", borderRadius: "var(--r-sm)" }}>
              <span className="ai-pill-dot" />
              {aiMode === "gemini"    ? "Gemini · Google"     :
               aiMode === "anthropic" ? "Claude · Anthropic"  :
               aiMode === "openai"    ? "GPT · OpenAI"        : "Smart Fallback"}
            </div>
            {aiMode === "fallback" && (
              <div style={{ fontSize: 10.5, color: "var(--text3)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
                Agregá GEMINI_API_KEY en .env para IA real
              </div>
            )}
          </div>
        </aside>

      </div>
    </>
  )
}
