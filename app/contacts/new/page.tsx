"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
const MatrixBackground = dynamic(()=>import("../../../components/MatrixBackground"),{ssr:false})
const CustomCursor = dynamic(()=>import("../../../components/CustomCursor"),{ssr:false})

export default function NewContact() {
  const router = useRouter()
  const nameRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ name:"", role:"", company:"", tags:"", daysSinceContact:"0", linkedin:"", phone:"" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(()=>{
    const t=(localStorage.getItem("orbita_theme") as "dark"|"light")??"dark"
    document.documentElement.setAttribute("data-theme",t)
    nameRef.current?.focus()
  },[])

  const set=(k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement>)=>setForm(p=>({...p,[k]:e.target.value}))

  const submit = async () => {
    if (!form.name.trim()) { setError("El nombre es obligatorio"); nameRef.current?.focus(); return }
    if (!form.role.trim()) { setError("El rol es obligatorio"); return }
    setLoading(true); setError("")
    try {
      const r = await fetch("/api/contacts",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name:form.name.trim(), role:form.role.trim(), company:form.company.trim(),
          tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean),
          daysSinceContact:Math.max(0,Number(form.daysSinceContact)||0),
          linkedin:form.linkedin.trim()||undefined, phone:form.phone.trim()||undefined })
      })
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error??"Error al crear")
      router.push(`/contacts/${d.contact.id}`)
    } catch(e:any){ setError(e.message); setLoading(false) }
  }

  return (
    <>
      <MatrixBackground/><CustomCursor/>
      <div className="cosmos-overlay"/><div className="scanlines"/>
      <main className="detail-shell">
        <button className="back-btn" onClick={()=>router.push("/")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Dashboard
        </button>

        <div style={{maxWidth:580}}>
          <div style={{marginBottom:28,animation:"fadeUp 0.4s ease"}}>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:28,fontWeight:800,letterSpacing:"-0.025em",marginBottom:8,background:"linear-gradient(135deg,var(--text),var(--signal))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              Nuevo contacto
            </h1>
            <p style={{fontSize:13,color:"var(--sub)",lineHeight:1.6}}>
              Agregá a alguien de tu red. Órbita generará un insight de IA automáticamente.
            </p>
          </div>

          <div className="card fade-up" style={{backdropFilter:"blur(16px)"}}>
            <div className="stack-lg">
              <div className="grid2">
                <div><label className="field-label">Nombre *</label>
                  <input ref={nameRef} className="input" value={form.name} onChange={set("name")} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Juan García"/></div>
                <div><label className="field-label">Rol / Cargo *</label>
                  <input className="input" value={form.role} onChange={set("role")} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Partner VC"/></div>
              </div>
              <div><label className="field-label">Empresa</label>
                <input className="input" value={form.company} onChange={set("company")} placeholder="Lucero Capital"/></div>
              <div><label className="field-label">Tags (separados por coma)</label>
                <input className="input" value={form.tags} onChange={set("tags")} placeholder="inversor, ai, fintech, connector"/>
                <div style={{fontSize:10,color:"var(--dim)",marginTop:4,fontFamily:"var(--font-mono)"}}>Usá: inversor, vc, connector, founder, advisor, cliente, mentor</div>
              </div>
              <div className="grid2">
                <div><label className="field-label">Días desde último contacto</label>
                  <input className="input" type="number" min="0" max="3650" value={form.daysSinceContact} onChange={set("daysSinceContact")} style={{maxWidth:140}}/></div>
                <div><label className="field-label">Teléfono (opcional)</label>
                  <input className="input" value={form.phone} onChange={set("phone")} placeholder="+54 11 1234-5678"/></div>
              </div>
              <div><label className="field-label">LinkedIn URL (opcional)</label>
                <input className="input" value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/nombre"/></div>

              {error && <div className="notice error">{error}</div>}

              <div style={{display:"flex",gap:10,paddingTop:4}}>
                <button className="btn btn-primary" onClick={submit} disabled={loading} style={{flex:1}}>
                  {loading ? <><span className="spinner"/>Creando y generando insight…</> : "Crear contacto → "}
                </button>
                <button className="btn btn-ghost" onClick={()=>router.push("/")} disabled={loading}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
