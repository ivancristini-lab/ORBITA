"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Mode = "register" | "login"

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("register")
  const [theme, setTheme] = useState<"dark"|"light">("dark")
  const [form, setForm] = useState({ name: "", email: "", goal: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const t = (localStorage.getItem("orbita_theme") as "dark"|"light") ?? "dark"
    setTheme(t)
    document.documentElement.setAttribute("data-theme", t)
    if (localStorage.getItem("orbita_session")) router.push("/")
  }, [router])

  const toggleTheme = () => {
    const n = theme === "dark" ? "light" : "dark"
    setTheme(n)
    document.documentElement.setAttribute("data-theme", n)
    localStorage.setItem("orbita_theme", n)
  }

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    setError("")
    if (!form.email.trim()) return setError("El email es obligatorio")
    if (mode === "register" && !form.name.trim()) return setError("El nombre es obligatorio")
    if (mode === "register" && !form.goal.trim()) return setError("El objetivo es obligatorio")
    setLoading(true)
    try {
      const r = await fetch(mode === "register" ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? { name: form.name.trim(), email: form.email.trim(), goal: form.goal.trim() }
            : { email: form.email.trim() }
        ),
      })
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error ?? "Error")
      localStorage.setItem("orbita_session", d.sessionToken ?? "demo")
      localStorage.setItem("orbita_theme", theme)
      router.push("/")
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      {/* Theme toggle */}
      <button className="theme-btn" onClick={toggleTheme}
        style={{ position: "fixed", top: 16, right: 16, zIndex: 100 }}>
        {theme === "dark" ? "☀" : "☾"}
      </button>

      <div className="auth-split">
        {/* Left: copy */}
        <div className="auth-left fade-in">
          <div className="auth-brand" style={{ marginBottom: 32 }}>
            <img src="/logo.png" alt="Órbita" />
            <span className="auth-brand-name">Órbita</span>
          </div>
          <h1 className="auth-heading">
            Sabés con quién<br />
            hablar.<br />
            <em>La IA te dice cuándo.</em>
          </h1>
          <p className="auth-body">
            Tu red de contactos analizada por inteligencia artificial.
            Cada relación priorizada. Cada momento, exacto.
          </p>
          <div className="auth-features">
            {[
              ["🧠", "Insights de IA por cada contacto"],
              ["🎯", "Score de urgencia en tiempo real"],
              ["✉️", "Mensajes listos para enviar"],
              ["🏆", "Registro de hitos y seguimiento"],
            ].map(([icon, text], i) => (
              <div key={i} className="auth-feat">
                <span className="auth-feat-icon">{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div className="auth-right fade-in" style={{ animationDelay: "0.08s" }}>
          <div className="auth-brand" style={{ marginBottom: 20 }}>
            <img src="/logo.png" alt="Órbita" />
            <span className="auth-brand-name">Órbita</span>
          </div>

          <div className="auth-card-title">
            {mode === "register" ? "Empezá gratis" : "Bienvenido de vuelta"}
          </div>
          <div className="auth-card-sub">
            {mode === "register"
              ? "Sin tarjeta de crédito. Activo en 30 segundos."
              : "Ingresá tu email para continuar."}
          </div>

          <div className="stack-sm">
            {mode === "register" && (
              <div>
                <label className="field-label">Tu nombre</label>
                <input className="input" placeholder="Juan García"
                  value={form.name} onChange={set("name")}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  autoFocus />
              </div>
            )}
            <div>
              <label className="field-label">Email</label>
              <input className="input" type="email" placeholder="vos@startup.com"
                value={form.email} onChange={set("email")}
                onKeyDown={e => e.key === "Enter" && submit()}
                autoFocus={mode === "login"} />
            </div>
            {mode === "register" && (
              <div>
                <label className="field-label">Objetivo principal</label>
                <input className="input" placeholder="Ej: Levantar $200k pre-seed en 60 días"
                  value={form.goal} onChange={set("goal")}
                  onKeyDown={e => e.key === "Enter" && submit()} />
                <div className="field-hint">La IA usa esto para personalizar cada insight.</div>
              </div>
            )}
            {error && <div className="notice error">{error}</div>}
            <button className="btn btn-primary btn-full" onClick={submit} disabled={loading}>
              {loading ? <><span className="spinner" /> Procesando…</> :
                mode === "register" ? "Crear cuenta →" : "Ingresar →"}
            </button>
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">o</span>
              <div className="auth-divider-line" />
            </div>
            <button className="btn btn-ghost btn-full" style={{ fontSize: 12 }}
              onClick={() => { localStorage.setItem("orbita_session", "demo"); router.push("/") }}>
              Explorar con datos de demo
            </button>
          </div>

          <div className="auth-switch">
            {mode === "register"
              ? <>¿Ya tenés cuenta? <button onClick={() => { setMode("login"); setError("") }}>Iniciá sesión</button></>
              : <>¿No tenés cuenta? <button onClick={() => { setMode("register"); setError("") }}>Registrate</button></>}
          </div>
        </div>
      </div>
    </div>
  )
}
