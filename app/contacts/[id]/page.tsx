"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import type { Contact, Insight, Milestone, Note } from "../../../lib/types"
import { scoreClass } from "../../../lib/scoring"

const MatrixBackground = dynamic(()=>import("../../../components/MatrixBackground"),{ssr:false})
const CustomCursor = dynamic(()=>import("../../../components/CustomCursor"),{ssr:false})

const initials=(n:string)=>n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)
const fmtDate=(iso:string)=>new Date(iso).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"})
const fmtDateInput=(iso:string)=>new Date(iso).toISOString().split("T")[0]
const insightColor=(t:string)=>t==="warning"?"var(--pulse)":t==="opportunity"?"var(--safe)":"var(--gold)"
const typeLabel=(t:string)=>t==="warning"?"⚠ En riesgo":t==="opportunity"?"🎯 Oportunidad":"🔥 Prioridad"
const avatarCls=(t:string|null)=>t==="warning"?"avatar-warn":t==="opportunity"?"avatar-opp":t==="priority"?"avatar-prio":"avatar-none"
const daysCls=(d:number)=>d>30?"crit":d>14?"warn":"ok"
const milestoneIcon=(t:string)=>({"meeting":"🤝","email":"📧","call":"📞","deal":"💰","intro":"🔗","event":"🎪","other":"📌"}[t]??"📌")

interface PageProps { params: { id: string } }

export default function ContactDetail({ params }: PageProps) {
  const router = useRouter()
  const { id } = params

  const [contact, setContact] = useState<Contact|null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [message, setMessage] = useState("")
  const [noteText, setNoteText] = useState("")

  const [pageLoading, setPageLoading] = useState(true)
  const [addingNote, setAddingNote] = useState(false)
  const [regenLoading, setRegenLoading] = useState(false)
  const [msgLoading, setMsgLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [flashInsight, setFlashInsight] = useState(false)
  const [editing, setEditing] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<"insight"|"notes"|"message"|"milestones">("insight")
  const [pageError, setPageError] = useState("")
  const [actionError, setActionError] = useState("")
  const [noteError, setNoteError] = useState("")

  // Milestone form
  const [milestoneForm, setMilestoneForm] = useState({ title:"", description:"", date:fmtDateInput(new Date().toISOString()), type:"meeting" as Milestone["type"] })
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)

  const [editForm, setEditForm] = useState({ name:"", role:"", company:"", tags:"", daysSinceContact:"0", linkedin:"", phone:"" })

  useEffect(()=>{
    const t=(localStorage.getItem("orbita_theme") as "dark"|"light")??"dark"
    document.documentElement.setAttribute("data-theme",t)
  },[])

  useEffect(()=>{
    Promise.all([
      fetch(`/api/contacts/${id}`).then(r=>r.json()),
      fetch(`/api/notes/${id}`).then(r=>r.json()),
      fetch(`/api/insights/${id}`).then(r=>r.json()),
      fetch(`/api/milestones/${id}`).then(r=>r.json()),
    ]).then(([cd,nd,ind,md])=>{
      setContact((cd as any).contact??null)
      setNotes((nd as any).notes??[])
      setInsights((ind as any).insights??[])
      setMilestones((md as any).milestones??[])
    }).catch(()=>setPageError("No se pudo cargar el contacto."))
    .finally(()=>setPageLoading(false))
  },[id])

  useEffect(()=>{
    if (!contact) return
    setEditForm({ name:contact.name, role:contact.role, company:contact.company, tags:contact.tags.join(", "),
      daysSinceContact:String(contact.daysSinceContact), linkedin:(contact as any).linkedin??"", phone:(contact as any).phone??"" })
  },[contact])

  const latestInsight = insights[0]??null

  const addNote = async () => {
    if (!noteText.trim()) { setNoteError("La nota no puede estar vacía."); return }
    setAddingNote(true); setNoteError("")
    try {
      const r = await fetch(`/api/notes/${id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:noteText.trim()})})
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error??"Error")
      setNotes(p=>[d.note,...p]); setNoteText("")
    } catch(e:any){ setNoteError(e.message) } finally { setAddingNote(false) }
  }

  const addMilestone = async () => {
    if (!milestoneForm.title.trim()) return
    setAddingMilestone(true)
    try {
      const r = await fetch(`/api/milestones/${id}`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...milestoneForm,contactId:id,date:new Date(milestoneForm.date).toISOString()})})
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error??"Error")
      setMilestones(p=>[d.milestone,...p])
      setMilestoneForm({title:"",description:"",date:fmtDateInput(new Date().toISOString()),type:"meeting"})
      setShowMilestoneForm(false)
    } catch {} finally { setAddingMilestone(false) }
  }

  const deleteMilestone = async (milestoneId: string) => {
    await fetch(`/api/milestones/${id}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:milestoneId})})
    setMilestones(p=>p.filter(m=>m.id!==milestoneId))
  }

  const regenerateInsight = async () => {
    setRegenLoading(true); setActionError("")
    try {
      const r = await fetch("/api/insights/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contactId:id})})
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error??"Error")
      setInsights(p=>[d.insight,...p])
      setFlashInsight(true); setTimeout(()=>setFlashInsight(false),700)
      setActiveTab("insight")
    } catch(e:any){ setActionError(e.message) } finally { setRegenLoading(false) }
  }

  const generateMsg = async () => {
    setMsgLoading(true); setMessage(""); setActionError("")
    try {
      const r = await fetch("/api/actions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contactId:id})})
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error??"Error")
      setMessage(d.message??""); setActiveTab("message")
    } catch(e:any){ setActionError(e.message) } finally { setMsgLoading(false) }
  }

  const copyMessage = async () => {
    if (!message) return
    try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(()=>setCopied(false),2500) } catch {}
  }

  const saveEdit = async () => {
    setSavingEdit(true); setActionError("")
    try {
      const r = await fetch(`/api/contacts/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ name:editForm.name.trim(), role:editForm.role.trim(), company:editForm.company.trim(),
          tags:editForm.tags.split(",").map(t=>t.trim()).filter(Boolean),
          daysSinceContact:Math.max(0,Number(editForm.daysSinceContact)||0),
          linkedin:editForm.linkedin.trim()||undefined, phone:editForm.phone.trim()||undefined })})
      const d = await r.json() as any
      if (!r.ok) throw new Error(d.error??"Error")
      setContact(d.contact); setEditing(false)
    } catch(e:any){ setActionError(e.message) } finally { setSavingEdit(false) }
  }

  const deleteContact = async () => {
    setDeleting(true)
    try {
      const r = await fetch(`/api/contacts/${id}`,{method:"DELETE"})
      if (!r.ok) throw new Error("Error eliminando")
      sessionStorage.setItem("orbita_toast",JSON.stringify({id:`t-${Date.now()}`,name:contact?.name??"",type:"priority",msg:"Contacto eliminado correctamente."}))
      router.push("/")
    } catch(e:any){ setActionError(e.message); setDeleting(false) }
  }

  const setEF=(k:keyof typeof editForm)=>(e:React.ChangeEvent<HTMLInputElement>)=>setEditForm(p=>({...p,[k]:e.target.value}))

  if (pageLoading) return (
    <><MatrixBackground/>
    <div className="loading-screen">
      <img src="/logo.png" alt="" className="loading-logo"/>
      <div className="loading-text">Cargando…</div>
    </div></>
  )
  if (!contact) return (
    <><MatrixBackground/><CustomCursor/>
    <main className="detail-shell">
      <button className="back-btn" onClick={()=>router.push("/")}>← Dashboard</button>
      <div className="notice error">{pageError||"Contacto no encontrado."}</div>
    </main></>
  )

  const accent = insightColor(latestInsight?.type??"priority")

  return (
    <>
      <MatrixBackground/><CustomCursor/>
      <div className="cosmos-overlay"/><div className="scanlines"/>
      <main className="detail-shell">
        <button className="back-btn" onClick={()=>router.push("/")}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Dashboard
        </button>

        {/* Hero */}
        <div className="contact-hero fade-up">
          <div className={`avatar-xl ${avatarCls(latestInsight?.type??null)}`}>{initials(contact.name)}</div>
          <div className="contact-hero-info">
            <div className="contact-hero-name">{contact.name}</div>
            <div className="contact-hero-role">{contact.role}{contact.company?` · ${contact.company}`:""}</div>
            <div className="contact-hero-tags" style={{marginTop:10}}>
              <span className={`days-badge ${daysCls(contact.daysSinceContact)}`}>
                {contact.daysSinceContact===0?"Contactado hoy":contact.daysSinceContact===1?"Contactado ayer":`${contact.daysSinceContact} días sin contacto`}
              </span>
              {latestInsight&&<span className={`chip chip-${latestInsight.type==="warning"?"warn":latestInsight.type==="opportunity"?"opp":"prio"}`}>{typeLabel(latestInsight.type)}</span>}
              {contact.tags.map(t=><span key={t} className="tag">#{t}</span>)}
              {(contact as any).phone&&<span className="tag">📞 {(contact as any).phone}</span>}
              {(contact as any).linkedin&&<a href={(contact as any).linkedin} target="_blank" rel="noopener noreferrer" className="tag" style={{color:"var(--signal)"}}>🔗 LinkedIn</a>}
            </div>
          </div>
          {latestInsight&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,paddingLeft:16,flexShrink:0}}>
              <div className={`dc-score-num ${scoreClass(latestInsight.score)}`} style={{fontSize:38,fontFamily:"var(--font-display)",fontWeight:800,color:accent,textShadow:`0 0 20px ${accent}66`}}>
                {latestInsight.score}
              </div>
              <div style={{fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"var(--font-mono)"}}>urgencia</div>
            </div>
          )}
        </div>

        {/* Edit form */}
        {editing&&(
          <div className="edit-overlay">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontWeight:700,fontSize:13,fontFamily:"var(--font-display)"}}>Editar contacto</span>
              <button className="btn-icon" onClick={()=>setEditing(false)}>✕</button>
            </div>
            <div className="grid2" style={{gap:10,marginBottom:10}}>
              <div><label className="field-label">Nombre</label><input className="input" value={editForm.name} onChange={setEF("name")}/></div>
              <div><label className="field-label">Rol</label><input className="input" value={editForm.role} onChange={setEF("role")}/></div>
            </div>
            <div style={{marginBottom:10}}><label className="field-label">Empresa</label><input className="input" value={editForm.company} onChange={setEF("company")}/></div>
            <div className="grid2" style={{gap:10,marginBottom:10}}>
              <div><label className="field-label">Tags</label><input className="input" value={editForm.tags} onChange={setEF("tags")}/></div>
              <div><label className="field-label">Días sin contacto</label><input className="input" type="number" min="0" value={editForm.daysSinceContact} onChange={setEF("daysSinceContact")}/></div>
            </div>
            <div className="grid2" style={{gap:10,marginBottom:14}}>
              <div><label className="field-label">LinkedIn URL</label><input className="input" value={editForm.linkedin} onChange={setEF("linkedin")}/></div>
              <div><label className="field-label">Teléfono</label><input className="input" value={editForm.phone} onChange={setEF("phone")}/></div>
            </div>
            {actionError&&<div className="notice error" style={{marginBottom:10}}>{actionError}</div>}
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={savingEdit} style={{flex:1}}>{savingEdit?<span className="spinner"/>:"Guardar cambios"}</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          <button className="btn btn-primary btn-sm" onClick={regenerateInsight} disabled={regenLoading}>
            {regenLoading?<><span className="spinner"/>Analizando…</>:"🧠 Generar insight"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={generateMsg} disabled={msgLoading}>
            {msgLoading?<><span className="spinner"/>Generando…</>:"✉️ Generar mensaje"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setEditing(e=>!e);setActionError("")}}>✏️ Editar</button>
          <button className="btn btn-violet btn-sm" onClick={()=>{setActiveTab("milestones");setShowMilestoneForm(true)}}>🏆 Agregar hito</button>
          <button className="btn btn-danger btn-sm" onClick={()=>setShowDeleteConfirm(true)} disabled={deleting} style={{marginLeft:"auto"}}>
            {deleting?<span className="spinner"/>:"🗑 Eliminar"}
          </button>
        </div>

        {showDeleteConfirm&&(
          <div className="delete-confirm">
            <span style={{fontSize:12}}>¿Eliminar a <strong>{contact.name}</strong> permanentemente?</span>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button className="btn btn-danger btn-xs" onClick={deleteContact} disabled={deleting}>{deleting?<span className="spinner"/>:"Sí, eliminar"}</button>
              <button className="btn btn-ghost btn-xs" onClick={()=>setShowDeleteConfirm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {actionError&&!editing&&<div className="notice error" style={{marginBottom:16}}>{actionError}</div>}

        {/* Tabs */}
        <div className="tabs">
          {([
            {id:"insight" as const,label:`🧠 Insight`},
            {id:"notes" as const,label:`📝 Notas (${notes.length})`},
            {id:"message" as const,label:"✉️ Mensaje"},
            {id:"milestones" as const,label:`🏆 Hitos (${milestones.length})`},
          ]).map(t=>(
            <button key={t.id} className={`tab ${activeTab===t.id?"active":""}`} onClick={()=>setActiveTab(t.id as any)}>{t.label}</button>
          ))}
        </div>

        {/* INSIGHT */}
        {activeTab==="insight"&&(
          <div className="fade-up">
            {!latestInsight?(
              <div className="card"><div className="empty-state">
                <span className="empty-icon">🤖</span><strong>Sin insight aún</strong>
                <button className="btn btn-primary btn-sm" onClick={regenerateInsight} disabled={regenLoading} style={{marginTop:14}}>
                  {regenLoading?<span className="spinner"/>:"🧠 Generar ahora"}
                </button>
              </div></div>
            ):(
              <div className={`insight-card ${flashInsight?"flash":""}`} style={{borderColor:accent,background:`color-mix(in srgb, ${accent} 3%, var(--card))`}}>
                <div className="insight-type-tag" style={{color:accent}}>{typeLabel(latestInsight.type)}</div>
                <div className="insight-message">{latestInsight.message}</div>
                <div className="insight-action-box">
                  <span className="insight-arrow">→</span>
                  <span className="insight-action-text">{latestInsight.suggestedAction}</span>
                </div>
                <div className="insight-footer">
                  <span style={{fontSize:10,color:"var(--dim)",fontFamily:"var(--font-mono)"}}>Generado {fmtDate(latestInsight.createdAt)}</span>
                  <div className="insight-score"><span className={`insight-score-num`} style={{color:accent}}>{latestInsight.score}</span><span style={{fontSize:10,color:"var(--dim)",fontFamily:"var(--font-mono)"}}>/100 urgencia</span></div>
                </div>
              </div>
            )}
            {insights.length>1&&(
              <div style={{marginTop:16}}>
                <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--dim)",marginBottom:8,fontFamily:"var(--font-mono)"}}>Historial</div>
                {insights.slice(1,4).map(ins=>(
                  <div key={ins.id} className="note-card">
                    <div style={{display:"flex",gap:8,marginBottom:4}}>
                      <span className={`chip chip-${ins.type==="warning"?"warn":ins.type==="opportunity"?"opp":"prio"}`} style={{fontSize:8}}>{typeLabel(ins.type)}</span>
                      <span style={{fontSize:9,color:"var(--dim)",fontFamily:"var(--font-mono)"}}>{fmtDate(ins.createdAt)}</span>
                      <span style={{marginLeft:"auto",fontFamily:"var(--font-display)",fontWeight:800,fontSize:13,color:insightColor(ins.type)}}>{ins.score}</span>
                    </div>
                    <div className="note-content">{ins.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOTES */}
        {activeTab==="notes"&&(
          <div className="fade-up">
            <div className="card" style={{marginBottom:14}}>
              <label className="field-label">Nueva nota</label>
              <textarea className="textarea" value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Contexto sobre la última interacción, lo que dijo, próximos pasos…" rows={4} autoFocus/>
              {noteError&&<div className="notice error" style={{marginTop:8}}>{noteError}</div>}
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <button className="btn btn-primary btn-sm" onClick={addNote} disabled={addingNote} style={{flex:1}}>{addingNote?<span className="spinner"/>:"Guardar nota"}</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>{setNoteText("");setNoteError("")}}>Limpiar</button>
              </div>
            </div>
            {notes.length===0?(
              <div className="card"><div className="empty-state"><span className="empty-icon">📝</span><strong>Sin notas</strong>Guardá contexto para mejorar los insights de IA.</div></div>
            ):(
              notes.map(n=>(
                <div key={n.id} className="note-card">
                  <div className="note-content">{n.content}</div>
                  <div className="note-date">{fmtDate(n.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MESSAGE */}
        {activeTab==="message"&&(
          <div className="fade-up">
            {!message?(
              <div className="card"><div className="empty-state">
                <span className="empty-icon">✉️</span><strong>Generá un mensaje personalizado</strong>
                La IA crea un outreach natural basado en tus notas e insight.
                <button className="btn btn-primary btn-sm" onClick={generateMsg} disabled={msgLoading} style={{marginTop:14}}>
                  {msgLoading?<><span className="spinner"/>Generando…</>:"✉️ Generar mensaje"}
                </button>
              </div></div>
            ):(
              <div>
                <div className="card" style={{marginBottom:12}}>
                  <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--dim)",marginBottom:10,fontFamily:"var(--font-mono)"}}>Mensaje sugerido por IA</div>
                  <div className="message-box">{message}</div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn btn-primary btn-sm" onClick={copyMessage} style={{flex:1}}>{copied?"✓ Copiado!":"Copiar mensaje"}</button>
                    <button className="btn btn-ghost btn-sm" onClick={generateMsg} disabled={msgLoading}>{msgLoading?<span className="spinner"/>:"↺ Regenerar"}</button>
                  </div>
                </div>
                <div className="notice" style={{fontSize:10}}>💡 Revisá y personalizá antes de enviar.</div>
              </div>
            )}
          </div>
        )}

        {/* MILESTONES */}
        {activeTab==="milestones"&&(
          <div className="fade-up">
            {showMilestoneForm&&(
              <div className="card" style={{marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,marginBottom:14,fontFamily:"var(--font-display)"}}>Registrar hito</div>
                <div className="stack-lg" style={{gap:12}}>
                  <div><label className="field-label">Título *</label>
                    <input className="input" value={milestoneForm.title} onChange={e=>setMilestoneForm(p=>({...p,title:e.target.value}))} placeholder="Primer reunión, intro a VC, firma de deal…"/></div>
                  <div className="grid2">
                    <div><label className="field-label">Tipo</label>
                      <select className="input" value={milestoneForm.type} onChange={e=>setMilestoneForm(p=>({...p,type:e.target.value as any}))} style={{appearance:"none"}}>
                        {["meeting","call","email","intro","deal","event","other"].map(t=><option key={t} value={t}>{milestoneIcon(t)} {t}</option>)}
                      </select></div>
                    <div><label className="field-label">Fecha</label>
                      <input className="input" type="date" value={milestoneForm.date} onChange={e=>setMilestoneForm(p=>({...p,date:e.target.value}))}/></div>
                  </div>
                  <div><label className="field-label">Descripción (opcional)</label>
                    <textarea className="textarea" rows={2} value={milestoneForm.description} onChange={e=>setMilestoneForm(p=>({...p,description:e.target.value}))} placeholder="Detalles del hito…"/></div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn btn-primary btn-sm" onClick={addMilestone} disabled={addingMilestone} style={{flex:1}}>{addingMilestone?<span className="spinner"/>:"Registrar hito"}</button>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setShowMilestoneForm(false)}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}
            {!showMilestoneForm&&(
              <button className="btn btn-violet btn-sm" onClick={()=>setShowMilestoneForm(true)} style={{marginBottom:14}}>🏆 + Agregar hito</button>
            )}
            {milestones.length===0&&!showMilestoneForm?(
              <div className="card"><div className="empty-state"><span className="empty-icon">🏆</span><strong>Sin hitos registrados</strong>Registrá los momentos clave de esta relación.</div></div>
            ):(
              milestones.map(m=>(
                <div key={m.id} className="milestone-card">
                  <div className="milestone-icon">{milestoneIcon(m.type)}</div>
                  <div className="milestone-body">
                    <div className="milestone-title">{m.title}</div>
                    {m.description&&<div className="milestone-desc">{m.description}</div>}
                    <div className="milestone-date">{fmtDate(m.date)} · {m.type}</div>
                  </div>
                  <button className="btn-icon" style={{fontSize:12,color:"var(--dim)"}} onClick={()=>deleteMilestone(m.id)}>🗑</button>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </>
  )
}
