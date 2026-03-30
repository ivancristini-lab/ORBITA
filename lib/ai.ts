import type { Contact, Insight, InsightType, Note } from "./types"

function cleanJson(raw: string): string {
  return raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim()
}

const SYS = `Eres ÓRBITA — IA de inteligencia relacional para founders.
Respondé SIEMPRE en español argentino. Solo JSON válido, sin markdown.
Schema: {"type":"opportunity"|"warning"|"priority","message":"2-3 oraciones estratégicas","suggestedAction":"acción concreta con verbo","score":1-100}
warning=relación en riesgo (>30d sin contacto+alto valor), opportunity=puede desbloquear recursos, priority=camino más directo al objetivo.
Score: 80-100 crítico, 60-79 importante, 40-59 útil. Sé específico, usá el nombre real.`

function userPrompt(c: Contact, notes: Note[], goal: string): string {
  return `OBJETIVO: ${goal}\nCONTACTO: ${c.name}, ${c.role} en ${c.company}\nDÍAS SIN CONTACTO: ${c.daysSinceContact}\nTAGS: ${c.tags.join(", ")}\nNOTAS: ${notes.map(n => n.content).join(" | ") || "ninguna"}`
}

async function callGemini(user: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY; if (!key) return null
  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash"
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYS }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 500, responseMimeType: "application/json" } }),
    })
    if (!r.ok) return null
    const d = await r.json() as any
    return d.candidates?.[0]?.content?.parts?.[0]?.text ?? null
  } catch { return null }
}

async function callAnthropic(user: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY; if (!key) return null
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 500, system: SYS, messages: [{ role: "user", content: user }] }),
    })
    if (!r.ok) return null
    const d = await r.json() as any
    return d.content?.[0]?.text ?? null
  } catch { return null }
}

async function callOpenAI(user: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY; if (!key) return null
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.3, response_format: { type: "json_object" }, messages: [{ role: "system", content: SYS }, { role: "user", content: user }] }),
    })
    if (!r.ok) return null
    const d = await r.json() as any
    return d.choices?.[0]?.message?.content ?? null
  } catch { return null }
}

function fallback(c: Contact, notes: Note[], goal: string): Omit<Insight, "id" | "createdAt"> {
  const txt = [c.role, c.company, ...c.tags, ...notes.map(n => n.content)].join(" ").toLowerCase()
  const isInv = /(inversor|vc|venture|capital|fund)/i.test(txt)
  const isFou = /(founder|ceo|seed|ronda)/i.test(txt)
  const isCon = /(connect|intro|red|network|event)/i.test(txt)
  const goalFund = /(levantar|capital|inversión|seed|ronda)/i.test(goal)
  let type: InsightType = c.daysSinceContact > 30 ? "warning" : "opportunity"
  if (isFou && goalFund) type = "priority"
  if (isInv && c.daysSinceContact > 30) type = "warning"
  let score = 50
  if (isInv && goalFund) score += 25; if (isCon) score += 15; if (isFou) score += 20
  if (c.daysSinceContact > 30) score -= 15; if (c.daysSinceContact < 7) score += 10
  score = Math.max(30, Math.min(99, Math.round(score)))
  const day = c.daysSinceContact === 0 ? "hoy" : c.daysSinceContact === 1 ? "ayer" : `hace ${c.daysSinceContact} días`
  const msgs: Record<InsightType, string> = {
    warning: `${c.name} lleva ${c.daysSinceContact} días sin contacto. Esta relación de alto valor se está enfriando — un contacto oportuno ahora es crítico antes de que la ventana se cierre.`,
    opportunity: `${c.name} tiene la red y posición para acelerar tu objetivo directamente. Representa una palanca sin activar que deberías mover esta semana.`,
    priority: `${c.name} es tu contacto de mayor leverage para el objetivo actual. Su experiencia y disposición para ayudar lo hacen irremplazable en esta etapa.`,
  }
  const acts: Record<InsightType, string> = {
    warning: `Mandále a ${c.name} un update breve hoy — un hito específico y pedí 15 minutos para ponerse al día.`,
    opportunity: `Pedile a ${c.name} 2 intros específicas. Sé directo sobre el tipo de persona que necesitás conocer.`,
    priority: `Agendá una llamada de 30 minutos con ${c.name} esta semana. Llegá con tu pedido principal.`,
  }
  return { contactId: c.id, type, message: msgs[type], suggestedAction: acts[type], score }
}

function parse(raw: string, contactId: string): Omit<Insight, "id" | "createdAt"> | null {
  try {
    const p = JSON.parse(cleanJson(raw)) as any
    const type = String(p.type ?? "").toLowerCase() as InsightType
    if (!["opportunity", "warning", "priority"].includes(type)) return null
    return { contactId, type, message: String(p.message ?? ""), suggestedAction: String(p.suggestedAction ?? p.suggested_action ?? ""), score: typeof p.score === "number" ? Math.round(p.score) : 70 }
  } catch { return null }
}

export async function generateInsight(c: Contact, notes: Note[], goal: string): Promise<Omit<Insight, "id" | "createdAt">> {
  const usr = userPrompt(c, notes, goal)
  for (const call of [callGemini, callAnthropic, callOpenAI]) {
    const raw = await call(usr)
    if (raw) { const p = parse(raw, c.id); if (p) return p }
  }
  return fallback(c, notes, goal)
}

export async function generateMessage(c: Contact, notes: Note[], insight: Insight | null, userName: string, goal: string): Promise<string> {
  const msgSys = `Sos ÓRBITA. Generás mensajes de outreach cortos (3-4 oraciones) en español argentino. Natural, directo, sin "espero que estés bien". Referenciá algo concreto de las notas. Solo el texto del mensaje.`
  const usr = `REMITENTE: ${userName}, trabajando en: ${goal}\nCONTACTO: ${c.name}, ${c.role} en ${c.company}\nDÍAS SIN CONTACTO: ${c.daysSinceContact}\nNOTAS: ${notes[0]?.content ?? ""}\nINSIGHT: ${insight?.suggestedAction ?? ""}`
  const raw = await callGemini(usr) ?? await callAnthropic(usr) ?? await callOpenAI(usr)
  if (raw && raw.length > 20 && !raw.includes("{")) return raw.trim()
  const n = notes[0]?.content?.split(".")[0] ?? ""
  return `Hola ${c.name}, ${n ? `recordé que ${n.toLowerCase()}.` : "quería retomarte."} Estoy trabajando en ${goal.toLowerCase()}. ${insight?.type === "warning" ? "¿Tenés 15 minutos esta semana para ponernos al día?" : "¿Podemos hablar? Tu perspectiva me sería muy valiosa."}`
}

export function getAiMode(): "gemini" | "anthropic" | "openai" | "fallback" {
  if (process.env.GEMINI_API_KEY) return "gemini"
  if (process.env.ANTHROPIC_API_KEY) return "anthropic"
  if (process.env.OPENAI_API_KEY) return "openai"
  return "fallback"
}
