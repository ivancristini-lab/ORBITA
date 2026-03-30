import type { Contact, Note, Insight, User, Milestone } from "./types"

export const DEMO_USER: User = {
  id: "user-demo",
  name: "Iván",
  email: "ivan@orbita.app",
  goal: "Levantar $200k pre-seed para mi startup de IA en los próximos 60 días",
  theme: "dark",
  createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
}

export const DEMO_CONTACTS: Contact[] = [
  { id: "c-juan", userId: "user-demo", name: "Juan Martínez", role: "Inversor Crypto & DeFi", company: "BlockCapital", tags: ["inversor", "crypto", "defi"], daysSinceContact: 38, createdAt: new Date(Date.now() - 38 * 86400000).toISOString() },
  { id: "c-lucas", userId: "user-demo", name: "Lucas Romero", role: "Partner VC", company: "Lucero Capital", tags: ["inversor", "ai", "fintech"], daysSinceContact: 45, createdAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: "c-carla", userId: "user-demo", name: "Carla Vega", role: "Connector & Events", company: "Tech Events Latam", tags: ["connector", "red-vc"], daysSinceContact: 10, createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "c-diego", userId: "user-demo", name: "Diego Suárez", role: "Founder & CEO", company: "FintechX", tags: ["founder", "advisor"], daysSinceContact: 2, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "c-maria", userId: "user-demo", name: "María González", role: "Angel Investor", company: "Independiente", tags: ["inversor", "angel", "saas"], daysSinceContact: 15, createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
]

export const DEMO_NOTES: Note[] = [
  { id: "n1", contactId: "c-juan", content: "Lo conocí en DeFi Latam. Tiene capital disponible. Le interesó la tesis de IA aplicada a finanzas on-chain. Quedó en que le mande un deck. Nunca lo hice.", createdAt: new Date(Date.now() - 38 * 86400000).toISOString() },
  { id: "n2", contactId: "c-lucas", content: "Partner en Lucero Capital. Fondo $50M especializado en AI y Fintech. Me pidió deck y one-pager. Tengo que mandárselo.", createdAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: "n3", contactId: "c-carla", content: "Organiza los eventos VC más importantes de Latam. Se ofreció a presentarme 3 VCs si le mando descripción de lo que busco.", createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "n4", contactId: "c-diego", content: "Levantó $500k hace 6 meses. Conoce todos los inversores locales. Ofreció revisar materiales y hacer intros.", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "n5", contactId: "c-maria", content: "Angel investor con exits en 2 SaaS. Invierte $25k-$50k. Está buscando proyectos AI para diversificar portfolio.", createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
]

export const DEMO_MILESTONES: Milestone[] = [
  { id: "m1", contactId: "c-juan", title: "Primer contacto en DeFi Latam", description: "Presentación inicial en el evento. Intercambio de contactos.", date: new Date(Date.now() - 38 * 86400000).toISOString(), type: "event", createdAt: new Date(Date.now() - 38 * 86400000).toISOString() },
  { id: "m2", contactId: "c-diego", title: "Call de 45 minutos", description: "Revisó nuestro pitch y dio feedback muy positivo sobre el mercado.", date: new Date(Date.now() - 5 * 86400000).toISOString(), type: "call", createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "m3", contactId: "c-carla", title: "Reunión en Café Martínez", description: "Charla sobre el ecosistema VC en Argentina. Muy buena conexión.", date: new Date(Date.now() - 12 * 86400000).toISOString(), type: "meeting", createdAt: new Date(Date.now() - 12 * 86400000).toISOString() },
]

export const DEMO_INSIGHTS: Insight[] = [
  { id: "i1", contactId: "c-juan", type: "warning", message: "Juan Martínez lleva 38 días sin contacto — prometiste enviar un deck en DeFi Latam y nunca lo hiciste. Esta ventana se está cerrando: los inversores crypto tienen ciclos de atención muy cortos.", suggestedAction: "Enviále hoy el deck con subject 'El deck que te prometí en DeFi Latam' — específico sobre IA + DeFi y pedí 20 minutos.", score: 92, createdAt: new Date(Date.now() - 38 * 86400000).toISOString() },
  { id: "i2", contactId: "c-lucas", type: "warning", message: "Lucas Romero de Lucero Capital esperaba tu deck hace 45 días. Un partner de fondo $50M especializado en AI es exactamente lo que necesitás. La demora prolongada puede interpretarse como falta de tracción.", suggestedAction: "Mandále el one-pager hoy. Agregá 2 métricas concretas y pedí 15 minutos para la semana que viene.", score: 88, createdAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: "i3", contactId: "c-carla", type: "opportunity", message: "Carla Vega tiene acceso directo a los VCs que te interesan y ya te ofreció intros activas. Con 10 días de contacto fresco, la relación está caliente. Activar ahora.", suggestedAction: "Escribile con los 3 VCs específicos que querés conocer y una línea de tu startup. Pedí las intros esta semana.", score: 85, createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "i4", contactId: "c-diego", type: "priority", message: "Diego Suárez levantó $500k recientemente y se ofreció a hacer intros. Con solo 2 días de contacto y experiencia directa en fundraising local, es tu recurso más valioso ahora mismo.", suggestedAction: "Mandále el deck y one-pager hoy. Pedí feedback específico sobre valuation y los inversores locales para contactar primero.", score: 78, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "i5", contactId: "c-maria", type: "opportunity", message: "María González es angel activa buscando proyectos AI. Un ticket de $25k-$50k podría ser el primer cheque que desbloquee la ronda y dé señal social a otros inversores.", suggestedAction: "Agendá llamada de 30 minutos esta semana. Llevá pitch completo y un term sheet borrador.", score: 71, createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
]
