"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

export default function NewContact() {
  const router = useRouter()
  const nameRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ name: "", role: "", company: "", tags: "", daysSinceContact: "0" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const t = (localStorage.getItem("orbita_theme") as "dark"|"light") ?? "dark"
    document.documentElement.setAttribute("data-theme", t)
    nameRef.current?.focus()
  }, [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    if (!form.name.trim()) { setError("El nombre es obligatorio"); nameRef.current?.focus(); return }
    if (!form.role.trim()) { setError("El rol es obligatorio"); return }
    setLoading(true); setError("")
    try {
      const r = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role.trim(),
          company: form.company.trim(),
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
          daysSinceContact: Math.max(0, Number(form.daysSinceContact) || 0),
        }),
      })
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error ?? "Error al crear")
      router.push(`/contacts/${d.contact.id}`)
    } catch (e: any) { setError(e.message); setLoading(false) }
  }

  return (
    <div className="form-shell">
      <div className="form-container">
        <button className="back-btn" onClick={() => router.push("/")}>
          ← Dashboard
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 400, letterSpacing: "-0.015em", marginBottom: 6 }}>
            Nuevo contacto
          </h1>
          <p style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.55 }}>
            Órbita genera un insight de IA automáticamente al crear el contacto.
          </p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "var(--r-lg)", padding: 24 }}>
          <div className="stack-md">
            <div className="grid2">
              <div>
                <label className="field-label">Nombre *</label>
                <input ref={nameRef} className="input" value={form.name} onChange={set("name")}
                  onKeyDown={e => e.key === "Enter" && submit()} placeholder="Juan García" />
              </div>
              <div>
                <label className="field-label">Rol *</label>
                <input className="input" value={form.role} onChange={set("role")}
                  onKeyDown={e => e.key === "Enter" && submit()} placeholder="Partner VC" />
              </div>
            </div>

            <div>
              <label className="field-label">Empresa</label>
              <input className="input" value={form.company} onChange={set("company")}
                placeholder="Lucero Capital" />
            </div>

            <div>
              <label className="field-label">Tags</label>
              <input className="input" value={form.tags} onChange={set("tags")}
                placeholder="inversor, ai, fintech" />
              <div className="field-hint">Separados por coma. Ej: inversor, vc, founder, connector, advisor</div>
            </div>

            <div>
              <label className="field-label">Días desde último contacto</label>
              <input className="input" type="number" min="0" max="3650"
                value={form.daysSinceContact} onChange={set("daysSinceContact")}
                style={{ maxWidth: 140 }} />
            </div>

            {error && <div className="notice error">{error}</div>}

            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ flex: 1 }}>
                {loading ? <><span className="spinner" /> Creando…</> : "Crear contacto →"}
              </button>
              <button className="btn btn-ghost" onClick={() => router.push("/")} disabled={loading}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
