import type { Contact, Note, Insight, User, Milestone } from "./types"

export const DEMO_USER: User = {
  id: "user-demo",
  name: "Iván",
  email: "ivan@orbita.app",
  goal: "Levantar $200k pre-seed en los próximos 60 días",
  theme: "dark",
  createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
}

export const DEMO_CONTACTS: Contact[] = [
  {
    id: "c-lucas",
    userId: "user-demo",
    name: "Lucas Romero",
    role: "Partner VC",
    company: "Lucero Capital",
    tags: ["inversor", "ai", "fintech"],
    daysSinceContact: 45,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "c-carla",
    userId: "user-demo",
    name: "Carla Vega",
    role: "Connector",
    company: "Tech Events Latam",
    tags: ["connector", "red-vc"],
    daysSinceContact: 10,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "c-diego",
    userId: "user-demo",
    name: "Diego Suárez",
    role: "Founder & CEO",
    company: "FintechX",
    tags: ["founder", "advisor"],
    daysSinceContact: 2,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
]

export const DEMO_NOTES: Note[] = [
  {
    id: "n1",
    contactId: "c-lucas",
    content: "Partner en Lucero Capital, fondo $50M en AI y Fintech. Me pidió deck y one-pager. Tengo que mandárselo urgente.",
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "n2",
    contactId: "c-carla",
    content: "Organiza los eventos VC más importantes de Latam. Se ofreció a presentarme 3 VCs si le mando una descripción de lo que busco.",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "n3",
    contactId: "c-diego",
    content: "Levantó $500k hace 6 meses. Conoce todos los inversores locales. Ofreció revisar materiales y hacer intros directas.",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
]

export const DEMO_MILESTONES: Milestone[] = [
  {
    id: "m1",
    contactId: "c-diego",
    title: "Call de 45 minutos",
    description: "Revisó nuestro pitch y dio feedback muy positivo.",
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    type: "call",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
]

export const DEMO_INSIGHTS: Insight[] = [
  {
    id: "i1",
    contactId: "c-lucas",
    type: "warning",
    message: "Lucas Romero esperaba tu deck hace 45 días y no lo recibió. Un partner de fondo $50M especializado en AI es exactamente tu perfil objetivo. La demora puede interpretarse como falta de tracción.",
    suggestedAction: "Mandále el one-pager hoy con 2 métricas concretas. Pedí 15 minutos para la semana que viene.",
    score: 92,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "i2",
    contactId: "c-carla",
    type: "opportunity",
    message: "Carla Vega tiene acceso directo a los VCs que te interesan y ya te ofreció intros activas. Con 10 días de contacto fresco, la relación está caliente. Es el momento exacto para activar el pedido.",
    suggestedAction: "Escribile con los 3 VCs específicos que querés conocer y una línea de tu startup. Pedí las intros esta semana.",
    score: 85,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "i3",
    contactId: "c-diego",
    type: "priority",
    message: "Diego Suárez levantó $500k recientemente y se ofreció a hacer intros. Con solo 2 días de contacto y experiencia directa en fundraising local, es tu recurso más valioso ahora mismo.",
    suggestedAction: "Mandále el deck hoy. Pedí feedback sobre valuation y los 3 inversores locales para contactar primero.",
    score: 78,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
]
