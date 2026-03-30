"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const MatrixBackground = dynamic(() => import("../../components/MatrixBackground"), { ssr: false })
const CustomCursor = dynamic(() => import("../../components/CustomCursor"), { ssr: false })

type Mode = "register" | "login"

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("register")
  const [theme, setTheme] = useState<"dark"|"light">("dark")
  const [form, setForm] = useState({ name: "", email: "", goal: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(0) // animation step

  useEffect(() => {
    const t = (localStorage.getItem("orbita_theme") as "dark"|"light") ?? "dark"
    setTheme(t); document.documentElement.setAttribute("data-theme", t)
    if (localStorage.getItem("orbita_session")) router.push("/")
    // Stagger animation
    setTimeout(() => setStep(1), 100)
    setTimeout(() => setStep(2), 300)
    setTimeout(() => setStep(3), 500)
  }, [router])

  const toggleTheme = () => {
    const n = theme === "dark" ? "light" : "dark"
    setTheme(n); document.documentElement.setAttribute("data-theme", n)
    localStorage.setItem("orbita_theme", n)
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setForm(p => ({...p,[k]:e.target.value}))

  const handleSubmit = async () => {
    setError("")
    if (!form.email.trim()) return setError("El email es obligatorio")
    if (mode === "register" && !form.name.trim()) return setError("El nombre es obligatorio")
    if (mode === "register" && !form.goal.trim()) return setError("El objetivo es obligatorio")
    setLoading(true)
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login"
      const body = mode === "register" ? { name: form.name.trim(), email: form.email.trim(), goal: form.goal.trim() } : { email: form.email.trim() }
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error ?? "Error de autenticación")
      localStorage.setItem("orbita_session", d.sessionToken ?? "demo")
      localStorage.setItem("orbita_theme", theme)
      router.push("/")
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const features = [
    { icon: "🧠", text: "Insights de Gemini AI sobre cada contacto" },
    { icon: "🎯", text: "Score de urgencia y alertas inteligentes" },
    { icon: "✉️", text: "Mensajes personalizados listos para enviar" },
    { icon: "📊", text: "Network Health Score en tiempo real" },
    { icon: "🏆", text: "Registro de hitos y milestones" },
    { icon: "🌐", text: "Listo para Supabase (producción)" },
  ]

  return (
    <>
      <MatrixBackground />
      <CustomCursor />
      <div className="cosmos-overlay" />
      <div className="scanlines" />

      <button className="theme-toggle" onClick={toggleTheme} style={{ position:"fixed", top:18, right:18, zIndex:100 }}
        title="Cambiar tema">{theme==="dark"?"☀️":"🌙"}
      </button>

      <div className="auth-shell">
        <div style={{ display:"flex", gap:60, alignItems:"center", maxWidth:900, width:"100%", flexWrap:"wrap", justifyContent:"center" }}>

          {/* Left: tagline */}
          <div style={{ flex:"0 0 340px", opacity: step>=2?1:0, transform: step>=2?"none":"translateX(-20px)", transition:"all 0.6s ease" }}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:7, fontSize:10, fontWeight:700,
              letterSpacing:"0.15em", textTransform:"uppercase", padding:"5px 14px", borderRadius:999,
              background:"rgba(0,212,255,0.07)", border:"1px solid rgba(0,212,255,0.2)",
              color:"var(--signal)", marginBottom:22, fontFamily:"var(--font-mono)"
            }}>
              <span style={{width:5,height:5,borderRadius:"50%",background:"var(--signal)",animation:"pulse-dot 2s ease infinite"}} />
              Ahora en beta
            </div>
            <h1 style={{
              fontFamily:"var(--font-display)", fontSize:"clamp(32px,4vw,52px)", fontWeight:800,
              letterSpacing:"-0.03em", lineHeight:1.05, marginBottom:16,
              background:"linear-gradient(135deg, var(--text) 0%, var(--signal) 60%, var(--violet) 100%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text"
            }}>
              Tu red de contactos,<br />amplificada por IA
            </h1>
            <p style={{ fontSize:14, color:"var(--sub)", lineHeight:1.7, marginBottom:28 }}>
              Órbita analiza tus relaciones y te dice exactamente con quién hablar, cuándo y qué decir para lograr tu objetivo.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {features.map((f,i) => (
                <div key={i} className="auth-feature" style={{ opacity: step>=3?1:0, transform: step>=3?"none":"translateX(-10px)", transition:`all 0.4s ease ${i*0.06}s` }}>
                  <span className="auth-feature-icon">{f.icon}</span>
                  {f.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="auth-card" style={{ opacity:step>=1?1:0, transform:step>=1?"none":"translateY(20px)", transition:"all 0.5s ease", flex:"0 0 420px" }}>
            <div className="auth-logo">
              <img src="/logo.png" alt="Órbita" />
              <div>
                <div className="auth-logo-name">ÓRBITA</div>
                <div className="auth-logo-tag">v3.0 · Relationship Intelligence</div>
              </div>
            </div>

            <div className="auth-title">{mode==="register"?"Empezá gratis":"Bienvenido de vuelta"}</div>
            <div className="auth-sub">
              {mode==="register"
                ? "Activá tu red con inteligencia artificial. Sin tarjeta de crédito."
                : "Ingresá con tu email para continuar."}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {mode==="register" && (
                <div>
                  <label className="field-label">Tu nombre *</label>
                  <input className="input" placeholder="Juan García" value={form.name} onChange={set("name")} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} autoFocus />
                </div>
              )}
              <div>
                <label className="field-label">Email *</label>
                <input className="input" type="email" placeholder="vos@startup.com" value={form.email} onChange={set("email")} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} autoFocus={mode==="login"} />
              </div>
              {mode==="register" && (
                <div>
                  <label className="field-label">Objetivo principal *</label>
                  <input className="input" placeholder="Ej: Levantar $200k pre-seed en 60 días" value={form.goal} onChange={set("goal")} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} />
                  <div style={{fontSize:10,color:"var(--dim)",marginTop:4,fontFamily:"var(--font-mono)"}}>La IA usará esto para personalizar los insights de tus contactos.</div>
                </div>
              )}
              {error && <div className="notice error">{error}</div>}
              <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading} style={{marginTop:4}}>
                {loading ? <><span className="spinner"/>Procesando…</> : mode==="register" ? "Crear cuenta gratis →" : "Ingresar →"}
              </button>
              <div className="auth-divider">
                <div className="auth-divider-line"/><div className="auth-divider-text">o</div><div className="auth-divider-line"/>
              </div>
              <button className="btn btn-ghost btn-full" onClick={()=>{localStorage.setItem("orbita_session","demo");router.push("/")}} style={{fontSize:12}}>
                🚀 Explorar con datos de demo
              </button>
            </div>

            <div className="auth-switch">
              {mode==="register"
                ? <>¿Ya tenés cuenta? <button onClick={()=>{setMode("login");setError("")}}>Iniciá sesión</button></>
                : <>¿No tenés cuenta? <button onClick={()=>{setMode("register");setError("")}}>Registrate gratis</button></>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
