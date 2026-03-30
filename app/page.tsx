"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import type { ContactWithInsight, User } from "../lib/types"
import { computeHealthScore, oppSignal, recencySignal, rowPriorityClass, scoreClass, trustSignal } from "../lib/scoring"

const MatrixBackground = dynamic(() => import("../components/MatrixBackground"), { ssr: false })
const CustomCursor = dynamic(() => import("../components/CustomCursor"), { ssr: false })

// Helpers
const initials = (n: string) => n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)
const fmtDays = (d: number) => d===0?"Hoy":d===1?"Ayer":`${d}d`
const avatarCls = (t?: string|null) => t==="warning"?"cr-av-warn":t==="opportunity"?"cr-av-opp":t==="priority"?"cr-av-prio":"cr-av-none"
const insightColor = (t?: string|null) => t==="warning"?"var(--pulse)":t==="opportunity"?"var(--safe)":"var(--gold)"

// ── Decision Card ──────────────────────────────────────────────
function DecisionCard({ c }: { c: ContactWithInsight }) {
  const ins = c.latestInsight!; const score = ins.score; const days = c.daysSinceContact
  const pills = [] as {l:string;c:string}[]
  if (score>=80) pills.push({l:`Score ${score}`,c:"hot"}); else if (score>=60) pills.push({l:`Score ${score}`,c:"gold"})
  if (days>30) pills.push({l:`${days}d silencio`,c:"hot"}); else if (days>7) pills.push({l:`${days}d`,c:"gold"}); else pills.push({l:"Reciente",c:"safe"})
  if (c.tags.includes("inversor")||c.tags.includes("vc")) pills.push({l:"Inversor",c:"gold"})
  if (c.tags.includes("connector")) pills.push({l:"Conector",c:"safe"})
  return (
    <Link href={`/contacts/${c.id}`} className="decision-card" style={{marginBottom:12}}>
      <div className="dc-accent" />
      <div className="dc-body">
        <div className="dc-eyebrow">
          <div className="dc-blink"/>
          {ins.type==="warning"?"RELACIÓN EN RIESGO":ins.type==="opportunity"?"OPORTUNIDAD ACTIVA":"ACCIÓN PRIORITARIA"}
        </div>
        <div className="dc-rows">
          <div className="dc-row"><span className="dc-row-label">Situación</span>
            <span className="dc-row-value hot">{ins.type==="warning"?`${c.name} lleva ${days} días sin contacto`:`${c.name} — oportunidad sin activar`}</span></div>
          <div className="dc-row"><span className="dc-row-label">Señales</span>
            <div className="dc-row-value why-pills">{pills.slice(0,4).map((p,i)=><span key={i} className={`dc-pill ${p.c}`}>{p.l}</span>)}</div></div>
          <div className="dc-row"><span className="dc-row-label">Acción</span>
            <div className="dc-action"><span>→</span>{ins.suggestedAction.split(".")[0]}</div></div>
        </div>
      </div>
      <div className="dc-score-col">
        <div className={`dc-score-num ${scoreClass(score)}`} style={{color:insightColor(ins.type)}}>{score}</div>
        <div className="dc-score-lbl">urgencia</div>
      </div>
    </Link>
  )
}

// ── Contact Row ───────────────────────────────────────────────
function ContactRow({ c, i }: { c: ContactWithInsight; i: number }) {
  const ins = c.latestInsight; const score = ins?.score ?? 0
  return (
    <Link href={`/contacts/${c.id}`} className={`contact-row ${rowPriorityClass(c)}`} style={{animationDelay:`${i*0.04}s`}}>
      <div className={`cr-avatar ${avatarCls(ins?.type)}`}>{initials(c.name)}</div>
      <div className="cr-info">
        <div className="cr-name">{c.name}</div>
        <div className="cr-role">{c.role}{c.company?` · ${c.company}`:""}</div>
      </div>
      <div className="signal-bars">
        {[{cls:"sf-trust",v:trustSignal(score)},{cls:"sf-recency",v:recencySignal(c.daysSinceContact)},{cls:"sf-opp",v:oppSignal(ins?.type)}].map((s,i)=>(
          <div key={i} className="signal-row">
            <span className="signal-lbl">{["Cof","Rec","Opp"][i]}</span>
            <div className="signal-track"><div className={`signal-fill ${s.cls}`} style={{width:`${s.v}%`}}/></div>
          </div>
        ))}
      </div>
      <div className="cr-score">
        <div className={`cr-score-num ${scoreClass(score)}`}>{score||"—"}</div>
        <div className="cr-score-lbl">{fmtDays(c.daysSinceContact)}</div>
      </div>
    </Link>
  )
}

// ── Feed Item ─────────────────────────────────────────────────
function FeedItem({ c }: { c: ContactWithInsight }) {
  const ins = c.latestInsight!
  const tc = ins.type==="warning"?"warn":ins.type==="opportunity"?"opp":"prio"
  const tl = ins.type==="warning"?"Riesgo":ins.type==="opportunity"?"Oportunidad":"Prioridad"
  return (
    <Link href={`/contacts/${c.id}`} className="feed-item">
      <div className="feed-who"><span className="feed-name">{c.name}</span><span className={`feed-type ft-${tc}`}>{tl}</span></div>
      <div className="feed-action">→ {ins.suggestedAction.split(" ").slice(0,9).join(" ")}{ins.suggestedAction.split(" ").length>9?"…":""}</div>
      <div className="feed-reason">{ins.message.split(" ").slice(0,12).join(" ")}{ins.message.split(" ").length>12?"…":""}</div>
    </Link>
  )
}

// ── Health Score ──────────────────────────────────────────────
function HealthScore({ contacts }: { contacts: ContactWithInsight[] }) {
  const { score, delta, color } = computeHealthScore(contacts)
  const r=38, circ=2*Math.PI*r
  const atRisk = contacts.filter(c=>c.latestInsight?.type==="warning").length
  const highPrio = contacts.filter(c=>(c.latestInsight?.score??0)>=80).length
  const avgDays = contacts.length ? Math.round(contacts.reduce((s,c)=>s+c.daysSinceContact,0)/contacts.length) : 0
  return (
    <div className="health-score">
      <div className="hs-ring">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle className="hs-bg-circle" cx="45" cy="45" r={r} strokeWidth="5"/>
          <circle className="hs-fill-circle" cx="45" cy="45" r={r} strokeWidth="5" stroke={color}
            strokeDasharray={circ} strokeDashoffset={circ*(1-score/100)} />
        </svg>
        <div className="hs-center">
          <div className="hs-value" style={{color}}>{score}</div>
          <div className="hs-of">/100</div>
        </div>
      </div>
      <div className="hs-label">Network Health</div>
      <div className={`hs-delta ${delta>=0?"pos":"neg"}`}><span>{delta>=0?"↑":"↓"}</span><span>{Math.abs(delta)}% 30d</span></div>
      <div className="hs-grid">
        {[
          {v:atRisk,l:"En riesgo",c:atRisk>0?"var(--pulse)":"var(--safe)"},
          {v:highPrio,l:"Alta prio.",c:"var(--gold)"},
          {v:contacts.length,l:"Contactos",c:"var(--signal)"},
          {v:`${avgDays}d`,l:"Prom. silencio",c:avgDays>20?"var(--pulse)":"var(--sub)"},
        ].map((m,i)=>(
          <div key={i} className="hs-mini">
            <div className="hs-mini-val" style={{color:m.c}}>{m.v}</div>
            <div className="hs-mini-lbl">{m.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stats Bar ─────────────────────────────────────────────────
function StatsBar({ contacts }: { contacts: ContactWithInsight[] }) {
  const total = contacts.length
  const warnings = contacts.filter(c=>c.latestInsight?.type==="warning").length
  const opps = contacts.filter(c=>c.latestInsight?.type==="opportunity").length
  const avgScore = total ? Math.round(contacts.reduce((s,c)=>s+(c.latestInsight?.score??0),0)/total) : 0
  const stats = [
    {v:total,l:"Contactos",c:"var(--signal)",icon:"🌐"},
    {v:warnings,l:"En riesgo",c:"var(--pulse)",icon:"🔴"},
    {v:opps,l:"Oportunidades",c:"var(--safe)",icon:"🎯"},
    {v:avgScore,l:"Score promedio",c:"var(--gold)",icon:"⚡"},
  ]
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
      {stats.map((s,i)=>(
        <div key={i} className="stat-card" style={{animationDelay:`${i*0.08}s`}}>
          <div style={{fontSize:18}}>{s.icon}</div>
          <div className="stat-value" style={{color:s.c}}>{s.v}</div>
          <div className="stat-label">{s.l}</div>
        </div>
      ))}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────
interface Toast { id:string; name:string; type:string; msg:string }
function ToastTray({ toasts, onClose }: { toasts:Toast[]; onClose:(id:string)=>void }) {
  if (!toasts.length) return null
  return (
    <div className="toast-tray">
      {toasts.map(t=>(
        <div key={t.id} className={`toast toast-${t.type==="warning"?"warn":t.type==="opportunity"?"opp":"prio"}`}>
          <div className="toast-icon">{t.type==="warning"?"⚠":"🎯"}</div>
          <div className="toast-body"><div className="toast-title">{t.name}</div><div className="toast-msg">{t.msg}</div></div>
          <button className="toast-close" onClick={()=>onClose(t.id)}>×</button>
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
  const [contacts, setContacts] = useState<ContactWithInsight[]>([])
  const [user, setUser] = useState<User|null>(null)
  const [aiMode, setAiMode] = useState("fallback")
  const [loading, setLoading] = useState(true)
  const [nav, setNav] = useState<"contacts"|"alerts"|"feed">("contacts")
  const [searchQ, setSearchQ] = useState("")
  const [editGoal, setEditGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState("")
  const [savingGoal, setSavingGoal] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [theme, setTheme] = useState<"dark"|"light">("dark")
  const [pageError, setPageError] = useState("")
  const goalRef = useRef<HTMLInputElement>(null)
  const closeToast = useCallback((id:string)=>setToasts(p=>p.filter(t=>t.id!==id)),[])

  useEffect(()=>{
    const s = localStorage.getItem("orbita_session")
    if (!s) { router.push("/auth"); return }
    const t = (localStorage.getItem("orbita_theme") as "dark"|"light") ?? "dark"
    setTheme(t); document.documentElement.setAttribute("data-theme", t)
    Promise.all([
      fetch("/api/contacts").then(r=>r.json()),
      fetch("/api/user").then(r=>r.json()),
      fetch("/api/health").then(r=>r.json()),
    ]).then(([cd,ud,hd])=>{
      const raw = (cd as any).contacts ?? []
      setContacts(raw.sort((a:ContactWithInsight,b:ContactWithInsight)=>(b.latestInsight?.score??0)-(a.latestInsight?.score??0)))
      setUser((ud as any).user ?? null)
      setAiMode((hd as any).aiMode ?? "fallback")
    }).catch(()=>setPageError("Error cargando datos.")).finally(()=>setLoading(false))
  },[router])

  useEffect(()=>{if(editGoal)goalRef.current?.focus()},[editGoal])

  useEffect(()=>{
    const p = sessionStorage.getItem("orbita_toast")
    if (p) { try { const t=JSON.parse(p); setToasts(x=>[t,...x].slice(0,3)); setTimeout(()=>closeToast(t.id),7000) } catch {} sessionStorage.removeItem("orbita_toast") }
  },[closeToast])

  const toggleTheme = () => {
    const n = theme==="dark"?"light":"dark"
    setTheme(n); document.documentElement.setAttribute("data-theme",n)
    localStorage.setItem("orbita_theme",n)
    fetch("/api/user",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({theme:n})}).catch(()=>{})
  }

  const saveGoal = async () => {
    if (!goalDraft.trim()) return
    setSavingGoal(true)
    try {
      const r = await fetch("/api/user",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({goal:goalDraft.trim()})})
      const d = await r.json() as any
      if (d.user) { setUser(d.user); setEditGoal(false) }
    } finally { setSavingGoal(false) }
  }

  const filtered = contacts.filter(c=>!searchQ||[c.name,c.role,c.company].join(" ").toLowerCase().includes(searchQ.toLowerCase()))
  const warnings = contacts.filter(c=>c.latestInsight?.type==="warning")
  const wowContact = contacts.find(c=>c.latestInsight)
  const feedItems = contacts.filter(c=>c.latestInsight).slice(0,6)
  const aiBadge = aiMode==="gemini"?"Gemini AI":aiMode==="anthropic"?"Claude AI":aiMode==="openai"?"GPT AI":"Smart Mode"

  if (loading) return (
    <>
      <MatrixBackground/>
      <div className="loading-screen">
        <img src="/logo.png" alt="Órbita" className="loading-logo"/>
        <div className="loading-text">Inicializando sistema…</div>
      </div>
    </>
  )

  return (
    <>
      <MatrixBackground/>
      <CustomCursor/>
      <div className="cosmos-overlay"/>
      <div className="scanlines"/>
      <ToastTray toasts={toasts} onClose={closeToast}/>

      <div className="app-shell">

        {/* ══ TOPBAR ══ */}
        <header className="topbar">
          <div className="topbar-logo">
            <img src="/logo.png" alt="Órbita"/>
            <div><div className="logo-name">ÓRBITA</div><div className="logo-tag">Relationship Intelligence</div></div>
          </div>
          <div className="topbar-search">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{color:"var(--sub)",flexShrink:0}}>
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 8l2.2 2.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input className="search-input" placeholder="Buscar contactos, roles, empresas…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
            <span className="search-hint">IA</span>
          </div>
          <div className="topbar-right">
            <span className={`ai-badge ${aiMode!=="fallback"?"active":""}`}><span className="badge-dot"/>{aiBadge}</span>
            <button className="theme-toggle" onClick={toggleTheme} title="Tema">{theme==="dark"?"☀️":"🌙"}</button>
            <Link href="/contacts/new"><button className="btn btn-primary btn-sm">+ Nuevo contacto</button></Link>
          </div>
        </header>

        {/* ══ SIDENAV ══ */}
        <aside className="sidenav">
          <Link href="/contacts/new">
            <button className="sidenav-new-btn">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              Agregar contacto
            </button>
          </Link>

          <div className="nav-section">
            <span className="nav-section-label">Red</span>
            {([
              {id:"contacts" as const,icon:"🌐",label:"Contactos",badge:contacts.length,soft:true},
              {id:"alerts" as const,icon:"🔴",label:"Alertas",badge:warnings.length,soft:false},
              {id:"feed" as const,icon:"⚡",label:"Feed de acciones",badge:0,soft:true},
            ]).map(n=>(
              <button key={n.id} className={`nav-item ${nav===n.id?"active":""}`} onClick={()=>setNav(n.id as "contacts"|"alerts"|"feed")}>
                <span className="nav-icon">{n.icon}</span>
                <span>{n.label}</span>
                {n.badge>0&&<span className={`nav-badge ${n.soft?"soft":""}`}>{n.badge}</span>}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <span className="nav-section-label">Objetivo</span>
            {editGoal ? (
              <div className="stack" style={{gap:6}}>
                <input ref={goalRef} className="input" style={{fontSize:11,padding:"7px 10px"}} value={goalDraft} onChange={e=>setGoalDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveGoal()} placeholder="Tu objetivo actual…"/>
                <div style={{display:"flex",gap:6}}>
                  <button className="btn btn-primary btn-xs" onClick={saveGoal} disabled={savingGoal} style={{flex:1}}>{savingGoal?<span className="spinner"/>:"✓ Guardar"}</button>
                  <button className="btn btn-ghost btn-xs" onClick={()=>setEditGoal(false)}>✕</button>
                </div>
              </div>
            ) : (
              <div className="goal-box" onClick={()=>{setGoalDraft(user?.goal??"");setEditGoal(true)}}>
                <div className="goal-box-label">Meta activa</div>
                <div className="goal-box-text">{user?.goal||"— Hacé clic para agregar"}</div>
              </div>
            )}
          </div>

          <div className="user-widget">
            {user && (
              <div className="user-row">
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <div><div className="user-name">{user.name}</div><div className="user-email">{user.email}</div></div>
              </div>
            )}
            <button className="nav-item" style={{color:"var(--dim)"}} onClick={()=>{localStorage.removeItem("orbita_session");router.push("/auth")}}>
              <span className="nav-icon">🚪</span><span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* ══ CENTER ══ */}
        <main className="center">
          <div className="center-scroll">
            {pageError && <div className="notice error">{pageError}</div>}

            {/* Stats bar */}
            <StatsBar contacts={contacts}/>

            {/* Decision card */}
            {wowContact && <DecisionCard c={wowContact}/>}

            {/* CONTACTS */}
            {nav==="contacts" && (
              <div className="fade-up">
                {filtered.length>0 && (
                  <div className="col-headers">
                    <div style={{width:38,flexShrink:0}}/>
                    <div style={{flex:1}}>Contacto</div>
                    <div style={{width:100}}>Cof · Rec · Opp</div>
                    <div style={{width:44,textAlign:"right"}}>Score</div>
                  </div>
                )}
                {contacts.length===0 ? (
                  <div className="card"><div className="empty-state">
                    <span className="empty-icon">🛸</span>
                    <strong>Sin contactos aún</strong>
                    Agregá tu primera relación para activar el motor de insights
                    <Link href="/contacts/new"><button className="btn btn-primary" style={{marginTop:14}}>+ Agregar contacto</button></Link>
                  </div></div>
                ) : (
                  <div className="stack" style={{gap:7}}>
                    {filtered.map((c,i)=><ContactRow key={c.id} c={c} i={i}/>)}
                    {filtered.length===0&&searchQ&&<div className="card"><div className="empty-state"><strong>Sin resultados</strong>Nada para "{searchQ}"</div></div>}
                  </div>
                )}
              </div>
            )}

            {/* ALERTS */}
            {nav==="alerts" && (
              <div className="fade-up">
                <div className="sec-hdr"><span className="sec-title">🔴 Alertas activas</span><span className="sec-count">{warnings.length} en riesgo</span></div>
                {warnings.length===0
                  ? <div className="card"><div className="empty-state"><span className="empty-icon">✅</span><strong>Sin alertas</strong>Tu red está al día</div></div>
                  : warnings.map(c=>(
                    <Link key={c.id} href={`/contacts/${c.id}`} className="alert-row">
                      <div className="alert-pulse"/>
                      <div className="alert-body">
                        <div className="alert-name">{c.name}<span style={{fontWeight:400,color:"var(--sub)"}}> — {fmtDays(c.daysSinceContact)} · {c.role}</span></div>
                        <div className="alert-msg">{c.latestInsight?.message}</div>
                        <div className="alert-action">→ {c.latestInsight?.suggestedAction}</div>
                      </div>
                      <div className={`score-ring ${scoreClass(c.latestInsight?.score??0)}`} style={{color:insightColor(c.latestInsight?.type)}}>{c.latestInsight?.score}</div>
                    </Link>
                  ))}
              </div>
            )}

            {/* FEED */}
            {nav==="feed" && (
              <div className="fade-up">
                <div className="sec-hdr"><span className="sec-title">⚡ Feed de decisiones</span><span className="sec-count">{feedItems.length} acciones</span></div>
                {feedItems.length===0
                  ? <div className="card"><div className="empty-state"><span className="empty-icon">🤖</span><strong>Sin acciones</strong>Generá insights en tus contactos</div></div>
                  : <div className="stack" style={{gap:8}}>{feedItems.map(c=><FeedItem key={c.id} c={c}/>)}</div>
                }
              </div>
            )}
          </div>
        </main>

        {/* ══ RIGHT PANEL ══ */}
        <aside className="rightnav">
          <div className="rn-section" style={{flex:1}}>
            <div className="rn-title">Feed de acciones</div>
            {feedItems.length===0
              ? <div style={{fontSize:11,color:"var(--dim)",paddingTop:8}}>Sin acciones disponibles</div>
              : feedItems.map(c=><FeedItem key={c.id} c={c}/>)
            }
          </div>
          <div className="rn-section">
            <div className="rn-title">Salud de red</div>
            <HealthScore contacts={contacts}/>
          </div>
          <div className="rn-section">
            <div className="rn-title">Motor IA</div>
            <div className={`ai-badge ${aiMode!=="fallback"?"active":""}`} style={{width:"100%",justifyContent:"flex-start",borderRadius:"var(--r-md)"}}>
              <span className="badge-dot"/>
              {aiMode==="gemini"?"Gemini (Google)":aiMode==="anthropic"?"Claude (Anthropic)":aiMode==="openai"?"GPT (OpenAI)":"Smart Fallback"}
            </div>
            {aiMode==="fallback"&&<div className="notice" style={{marginTop:8,fontSize:10}}>Agregá <strong style={{color:"var(--signal)"}}>GEMINI_API_KEY</strong> para IA real.</div>}
          </div>
        </aside>

      </div>
    </>
  )
}
