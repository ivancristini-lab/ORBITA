"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { Contact, Insight, Milestone, Note } from "../../../lib/types"
import { scoreClass } from "../../../lib/scoring"

const initials   = (n: string) => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
const fmtDate    = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })
const fmtDateIn  = (iso: string) => new Date(iso).toISOString().split("T")[0]
const iColor     = (t: string) => t === "warning" ? "var(--red)" : t === "opportunity" ? "var(--green)" : "var(--orange)"
const iCls       = (t: string) => t === "warning" ? "warn" : t === "opportunity" ? "opp" : "prio"
const iLabel     = (t: string) => t === "warning" ? "Relación en riesgo" : t === "opportunity" ? "Oportunidad activa" : "Acción prioritaria"
const avCls      = (t: string | null) => t === "warning" ? "hero-av-warn" : t === "opportunity" ? "hero-av-opp" : t === "priority" ? "hero-av-prio" : "hero-av-none"
const daysCls    = (d: number) => d > 30 ? "warn" : d > 14 ? "prio" : "opp"
const msIcon     = (t: string) => ({"meeting":"🤝","email":"📧","call":"📞","deal":"💰","intro":"🔗","event":"🎪","other":"📌"} as any)[t] ?? "📌"

interface P { params: { id: string } }

export default function ContactDetail({ params }: P) {
  const router  = useRouter()
  const { id }  = params

  const [contact,    setContact]    = useState<Contact | null>(null)
  const [notes,      setNotes]      = useState<Note[]>([])
  const [insights,   setInsights]   = useState<Insight[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [message,    setMessage]    = useState("")
  const [noteText,   setNoteText]   = useState("")

  const [pageLoading,  setPageLoading]  = useState(true)
  const [regenLoading, setRegenLoading] = useState(false)
  const [msgLoading,   setMsgLoading]   = useState(false)
  const [addingNote,   setAddingNote]   = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [savingEdit,   setSavingEdit]   = useState(false)
  const [copied,       setCopied]       = useState(false)
  const [flashInsight, setFlashInsight] = useState(false)
  const [editing,      setEditing]      = useState(false)
  const [showDelete,   setShowDelete]   = useState(false)
  const [activeTab,    setActiveTab]    = useState<"insight"|"notes"|"message"|"milestones">("insight")
  const [pageError,    setPageError]    = useState("")
  const [actionError,  setActionError]  = useState("")
  const [noteError,    setNoteError]    = useState("")
  const [showMsForm,   setShowMsForm]   = useState(false)
  const [addingMs,     setAddingMs]     = useState(false)

  const [editForm, setEditForm] = useState({ name:"", role:"", company:"", tags:"", daysSinceContact:"0" })
  const [msForm,   setMsForm]   = useState({ title:"", description:"", date: fmtDateIn(new Date().toISOString()), type:"meeting" as Milestone["type"] })

  useEffect(() => {
    const t = (localStorage.getItem("orbita_theme") as "dark"|"light") ?? "dark"
    document.documentElement.setAttribute("data-theme", t)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch(`/api/contacts/${id}`).then(r => r.json()),
      fetch(`/api/notes/${id}`).then(r => r.json()),
      fetch(`/api/insights/${id}`).then(r => r.json()),
      fetch(`/api/milestones/${id}`).then(r => r.json()),
    ]).then(([cd, nd, ind, md]) => {
      setContact((cd as any).contact ?? null)
      setNotes((nd as any).notes ?? [])
      setInsights((ind as any).insights ?? [])
      setMilestones((md as any).milestones ?? [])
    }).catch(() => setPageError("No se pudo cargar."))
    .finally(() => setPageLoading(false))
  }, [id])

  useEffect(() => {
    if (!contact) return
    setEditForm({ name: contact.name, role: contact.role, company: contact.company,
      tags: contact.tags.join(", "), daysSinceContact: String(contact.daysSinceContact) })
  }, [contact])

  const latest = insights[0] ?? null

  const regen = async () => {
    setRegenLoading(true); setActionError("")
    try {
      const r = await fetch("/api/insights/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId: id }) })
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error ?? "Error")
      setInsights(p => [d.insight, ...p])
      setFlashInsight(true); setTimeout(() => setFlashInsight(false), 600)
      setActiveTab("insight")
    } catch (e: any) { setActionError(e.message) }
    finally { setRegenLoading(false) }
  }

  const genMsg = async () => {
    setMsgLoading(true); setMessage(""); setActionError("")
    try {
      const r = await fetch("/api/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId: id }) })
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error ?? "Error")
      setMessage(d.message ?? ""); setActiveTab("message")
    } catch (e: any) { setActionError(e.message) }
    finally { setMsgLoading(false) }
  }

  const addNote = async () => {
    if (!noteText.trim()) { setNoteError("La nota no puede estar vacía"); return }
    setAddingNote(true); setNoteError("")
    try {
      const r = await fetch(`/api/notes/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: noteText.trim() }) })
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error)
      setNotes(p => [d.note, ...p]); setNoteText("")
    } catch (e: any) { setNoteError(e.message) }
    finally { setAddingNote(false) }
  }

  const addMilestone = async () => {
    if (!msForm.title.trim()) return
    setAddingMs(true)
    try {
      const r = await fetch(`/api/milestones/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...msForm, contactId: id, date: new Date(msForm.date).toISOString() }) })
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error)
      setMilestones(p => [d.milestone, ...p])
      setMsForm({ title: "", description: "", date: fmtDateIn(new Date().toISOString()), type: "meeting" })
      setShowMsForm(false)
    } catch {}
    finally { setAddingMs(false) }
  }

  const delMilestone = async (mid: string) => {
    await fetch(`/api/milestones/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: mid }) })
    setMilestones(p => p.filter(m => m.id !== mid))
  }

  const saveEdit = async () => {
    setSavingEdit(true); setActionError("")
    try {
      const r = await fetch(`/api/contacts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editForm.name.trim(), role: editForm.role.trim(), company: editForm.company.trim(), tags: editForm.tags.split(",").map(t => t.trim()).filter(Boolean), daysSinceContact: Math.max(0, Number(editForm.daysSinceContact) || 0) }) })
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error)
      setContact(d.contact); setEditing(false)
    } catch (e: any) { setActionError(e.message) }
    finally { setSavingEdit(false) }
  }

  const deleteContact = async () => {
    setDeleting(true)
    try {
      const r = await fetch(`/api/contacts/${id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Error")
      sessionStorage.setItem("orbita_toast", JSON.stringify({ name: contact?.name, msg: "Contacto eliminado." }))
      router.push("/")
    } catch (e: any) { setActionError(e.message); setDeleting(false) }
  }

  const setEF = (k: keyof typeof editForm) => (e: React.ChangeEvent<HTMLInputElement>) => setEditForm(p => ({ ...p, [k]: e.target.value }))

  if (pageLoading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span className="spinner" style={{ width: 18, height: 18 }} />
    </div>
  )

  if (!contact) return (
    <div className="detail-page">
      <div className="detail-shell">
        <button className="back-btn" onClick={() => router.push("/")}>← Dashboard</button>
        <div className="notice error">{pageError || "Contacto no encontrado."}</div>
      </div>
    </div>
  )

  return (
    <div className="detail-page">
      <div className="detail-shell">
        <button className="back-btn" onClick={() => router.push("/")}>← Dashboard</button>

        {/* Hero */}
        <div className="contact-hero fade-in">
          <div className={`hero-avatar ${avCls(latest?.type ?? null)}`}>{initials(contact.name)}</div>
          <div className="hero-info">
            <div className="hero-name">{contact.name}</div>
            <div className="hero-role">{contact.role}{contact.company ? ` · ${contact.company}` : ""}</div>
            <div className="hero-tags" style={{ marginTop: 10 }}>
              <span className={`htag ${daysCls(contact.daysSinceContact)}`}>
                {contact.daysSinceContact === 0 ? "Contactado hoy" :
                 contact.daysSinceContact === 1 ? "Ayer" :
                 `${contact.daysSinceContact} días sin contacto`}
              </span>
              {contact.tags.map(t => <span key={t} className="htag">#{t}</span>)}
            </div>
          </div>
          {latest && (
            <div className="hero-score">
              <div className={`hero-score-num ${scoreClass(latest.score)}`} style={{ color: iColor(latest.type) }}>
                {latest.score}
              </div>
              <div className="hero-score-lbl">urgencia</div>
            </div>
          )}
        </div>

        {/* Edit overlay */}
        {editing && (
          <div className="edit-overlay">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Editar contacto</span>
              <button className="btn-icon" onClick={() => setEditing(false)}>✕</button>
            </div>
            <div className="stack-sm">
              <div className="grid2">
                <div><label className="field-label">Nombre</label><input className="input" value={editForm.name} onChange={setEF("name")} /></div>
                <div><label className="field-label">Rol</label><input className="input" value={editForm.role} onChange={setEF("role")} /></div>
              </div>
              <div><label className="field-label">Empresa</label><input className="input" value={editForm.company} onChange={setEF("company")} /></div>
              <div className="grid2">
                <div><label className="field-label">Tags</label><input className="input" value={editForm.tags} onChange={setEF("tags")} /></div>
                <div><label className="field-label">Días sin contacto</label><input className="input" type="number" min="0" value={editForm.daysSinceContact} onChange={setEF("daysSinceContact")} /></div>
              </div>
              {actionError && <div className="notice error">{actionError}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={savingEdit} style={{ flex: 1 }}>
                  {savingEdit ? <span className="spinner" /> : "Guardar"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="action-bar">
          <button className="btn btn-ghost btn-sm" onClick={regen} disabled={regenLoading}>
            {regenLoading ? <><span className="spinner" /> Analizando…</> : "⚡ Generar insight"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={genMsg} disabled={msgLoading}>
            {msgLoading ? <><span className="spinner" /> Generando…</> : "✉ Mensaje"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(e => !e); setActionError("") }}>
            ✎ Editar
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)} disabled={deleting} style={{ marginLeft: "auto" }}>
            {deleting ? <span className="spinner" /> : "Eliminar"}
          </button>
        </div>

        {/* Delete confirm */}
        {showDelete && (
          <div className="delete-confirm">
            <span>¿Eliminar a <strong>{contact.name}</strong>?</span>
            <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
              <button className="btn btn-danger btn-xs" onClick={deleteContact} disabled={deleting}>
                {deleting ? <span className="spinner" /> : "Eliminar"}
              </button>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowDelete(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {actionError && !editing && <div className="notice error" style={{ marginBottom: 14 }}>{actionError}</div>}

        {/* Tabs */}
        <div className="tabs">
          {(["insight","notes","message","milestones"] as const).map(t => (
            <button key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
              {t === "insight" ? `⚡ Insight` :
               t === "notes"   ? `✎ Notas (${notes.length})` :
               t === "message" ? `✉ Mensaje` :
               `◆ Hitos (${milestones.length})`}
            </button>
          ))}
        </div>

        {/* ── INSIGHT TAB ── */}
        {activeTab === "insight" && (
          <div className="fade-in">
            {!latest ? (
              <div className="empty-state">
                <span className="empty-icon">⚡</span>
                <strong>Sin insight todavía</strong>
                <button className="btn btn-ghost btn-sm" onClick={regen} disabled={regenLoading} style={{ marginTop: 12 }}>
                  {regenLoading ? <span className="spinner" /> : "Generar insight"}
                </button>
              </div>
            ) : (
              <div className={`detail-insight ${iCls(latest.type)} ${flashInsight ? "flash" : ""}`}>
                <div className="di-type">{iLabel(latest.type)}</div>
                <div className="di-message">{latest.message}</div>
                <div className="di-action">
                  <span className="di-arrow">→</span>
                  <span>{latest.suggestedAction}</span>
                </div>
                <div className="di-footer">
                  <span>Generado {fmtDate(latest.createdAt)}</span>
                  <span style={{ color: iColor(latest.type), fontWeight: 600 }}>Score {latest.score}</span>
                </div>
              </div>
            )}
            {insights.length > 1 && (
              <div>
                <div className="section-label" style={{ marginTop: 20 }}>Historial</div>
                {insights.slice(1, 4).map(ins => (
                  <div key={ins.id} className="note-card">
                    <div style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: iColor(ins.type), fontWeight: 600 }}>{iLabel(ins.type)}</span>
                      <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>{fmtDate(ins.createdAt)}</span>
                      <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: iColor(ins.type) }}>{ins.score}</span>
                    </div>
                    <div className="note-content">{ins.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {activeTab === "notes" && (
          <div className="fade-in">
            <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "var(--r-lg)", padding: 16, marginBottom: 14 }}>
              <label className="field-label">Nueva nota</label>
              <textarea className="textarea" value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Contexto, lo que dijo, próximos pasos…" rows={3} autoFocus />
              {noteError && <div className="notice error" style={{ marginTop: 8 }}>{noteError}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn btn-primary btn-sm" onClick={addNote} disabled={addingNote} style={{ flex: 1 }}>
                  {addingNote ? <span className="spinner" /> : "Guardar nota"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setNoteText(""); setNoteError("") }}>Limpiar</button>
              </div>
            </div>
            {notes.length === 0 ? (
              <div className="empty-state"><span className="empty-icon">✎</span><strong>Sin notas</strong></div>
            ) : (
              notes.map(n => (
                <div key={n.id} className="note-card">
                  <div className="note-content">{n.content}</div>
                  <div className="note-date">{fmtDate(n.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── MESSAGE TAB ── */}
        {activeTab === "message" && (
          <div className="fade-in">
            {!message ? (
              <div className="empty-state">
                <span className="empty-icon">✉</span>
                <strong>Generá un mensaje personalizado</strong>
                <span style={{ fontSize: 12 }}>La IA crea un outreach natural basado en tus notas e insight.</span>
                <button className="btn btn-ghost btn-sm" onClick={genMsg} disabled={msgLoading} style={{ marginTop: 12 }}>
                  {msgLoading ? <><span className="spinner" /> Generando…</> : "Generar mensaje"}
                </button>
              </div>
            ) : (
              <>
                <div className="message-box">{message}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {} }} style={{ flex: 1 }}>
                    {copied ? "✓ Copiado" : "Copiar"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={genMsg} disabled={msgLoading}>
                    {msgLoading ? <span className="spinner" /> : "↺ Regenerar"}
                  </button>
                </div>
                <div className="notice" style={{ marginTop: 10, fontSize: 11 }}>Revisá y personalizá antes de enviar.</div>
              </>
            )}
          </div>
        )}

        {/* ── MILESTONES TAB ── */}
        {activeTab === "milestones" && (
          <div className="fade-in">
            {!showMsForm ? (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMsForm(true)} style={{ marginBottom: 14 }}>
                + Registrar hito
              </button>
            ) : (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "var(--r-lg)", padding: 16, marginBottom: 14 }}>
                <div className="stack-sm">
                  <div><label className="field-label">Título *</label>
                    <input className="input" value={msForm.title} onChange={e => setMsForm(p => ({ ...p, title: e.target.value }))} placeholder="Primera reunión, intro a VC…" autoFocus /></div>
                  <div className="grid2">
                    <div><label className="field-label">Tipo</label>
                      <select className="input" value={msForm.type} onChange={e => setMsForm(p => ({ ...p, type: e.target.value as any }))}>
                        {["meeting","call","email","intro","deal","event","other"].map(t => <option key={t} value={t}>{msIcon(t)} {t}</option>)}
                      </select></div>
                    <div><label className="field-label">Fecha</label>
                      <input className="input" type="date" value={msForm.date} onChange={e => setMsForm(p => ({ ...p, date: e.target.value }))} /></div>
                  </div>
                  <div><label className="field-label">Descripción</label>
                    <textarea className="textarea" rows={2} value={msForm.description} onChange={e => setMsForm(p => ({ ...p, description: e.target.value }))} placeholder="Detalles…" /></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={addMilestone} disabled={addingMs} style={{ flex: 1 }}>
                      {addingMs ? <span className="spinner" /> : "Registrar"}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowMsForm(false)}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}
            {milestones.length === 0 && !showMsForm ? (
              <div className="empty-state"><span className="empty-icon">◆</span><strong>Sin hitos registrados</strong></div>
            ) : (
              milestones.map(m => (
                <div key={m.id} className="milestone-card">
                  <div className="milestone-icon">{msIcon(m.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="milestone-title">{m.title}</div>
                    {m.description && <div className="milestone-desc">{m.description}</div>}
                    <div className="milestone-date">{fmtDate(m.date)} · {m.type}</div>
                  </div>
                  <button className="btn-icon" style={{ fontSize: 12, color: "var(--text3)" }} onClick={() => delMilestone(m.id)}>✕</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
