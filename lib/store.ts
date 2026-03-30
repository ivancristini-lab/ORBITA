import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import type { Contact, ContactInput, ContactWithInsight, Insight, Milestone, MilestoneInput, Note, NoteInput, User } from "./types"
import { DEMO_CONTACTS, DEMO_INSIGHTS, DEMO_MILESTONES, DEMO_NOTES, DEMO_USER } from "./demo"

interface OrbitaState {
  user: User
  contacts: Contact[]
  notes: Note[]
  milestones: Milestone[]
  insights: Insight[]
}

declare global {
  var __orbitaState: OrbitaState | undefined
  var __orbitaWriteQueue: Promise<void> | undefined
}

const DATA_DIR = path.join(process.cwd(), ".orbita-data")
const DATA_FILE = path.join(DATA_DIR, "store.json")

function clone(state: OrbitaState): OrbitaState {
  return JSON.parse(JSON.stringify(state))
}

function seed(): OrbitaState {
  return clone({ user: DEMO_USER, contacts: DEMO_CONTACTS, notes: DEMO_NOTES, milestones: DEMO_MILESTONES, insights: DEMO_INSIGHTS })
}

async function persist(state: OrbitaState): Promise<void> {
  try { await mkdir(DATA_DIR, { recursive: true }); await writeFile(DATA_FILE, JSON.stringify(state, null, 2), "utf-8") } catch {}
}

async function load(): Promise<OrbitaState> {
  if (globalThis.__orbitaState) return clone(globalThis.__orbitaState)
  try {
    const raw = await readFile(DATA_FILE, "utf-8")
    const p = JSON.parse(raw) as Partial<OrbitaState>
    if (p.user && Array.isArray(p.contacts)) {
      const s = { user: p.user, contacts: p.contacts, notes: p.notes ?? [], milestones: p.milestones ?? [], insights: p.insights ?? [] }
      globalThis.__orbitaState = s; return clone(s)
    }
  } catch {}
  const s = seed(); globalThis.__orbitaState = s; await persist(s); return clone(s)
}

async function mutate(fn: (d: OrbitaState) => OrbitaState): Promise<OrbitaState> {
  const run = async () => {
    const cur = await load(); const next = fn(clone(cur))
    globalThis.__orbitaState = next; await persist(next)
  }
  globalThis.__orbitaWriteQueue = (globalThis.__orbitaWriteQueue ?? Promise.resolve()).then(run, run)
  await globalThis.__orbitaWriteQueue
  return clone(globalThis.__orbitaState!)
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// User
export async function getUser(): Promise<User> { return (await load()).user }
export async function updateUser(data: Partial<User>): Promise<User> {
  const s = await mutate(d => ({ ...d, user: { ...d.user, ...data } })); return s.user
}

// Contacts
export async function getContacts(): Promise<ContactWithInsight[]> {
  const s = await load()
  return s.contacts.map(c => ({
    ...c,
    latestInsight: s.insights.filter(i => i.contactId === c.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null,
    notesCount: s.notes.filter(n => n.contactId === c.id).length,
  }))
}
export async function getContact(id: string): Promise<Contact | null> {
  return (await load()).contacts.find(c => c.id === id) ?? null
}
export async function createContact(input: ContactInput): Promise<Contact> {
  const s = await load()
  const c: Contact = { id: makeId(), userId: s.user.id, createdAt: new Date().toISOString(), ...input }
  await mutate(d => ({ ...d, contacts: [...d.contacts, c] })); return c
}
export async function updateContact(id: string, input: Partial<ContactInput>): Promise<Contact | null> {
  const s = await mutate(d => ({ ...d, contacts: d.contacts.map(c => c.id === id ? { ...c, ...input } : c) }))
  return s.contacts.find(c => c.id === id) ?? null
}
export async function deleteContact(id: string): Promise<boolean> {
  let found = false
  await mutate(d => {
    found = d.contacts.some(c => c.id === id)
    if (!found) return d
    return { ...d, contacts: d.contacts.filter(c => c.id !== id), notes: d.notes.filter(n => n.contactId !== id), insights: d.insights.filter(i => i.contactId !== id), milestones: d.milestones.filter(m => m.contactId !== id) }
  })
  return found
}

// Notes
export async function getNotes(contactId: string): Promise<Note[]> {
  return (await load()).notes.filter(n => n.contactId === contactId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
export async function createNote(input: NoteInput): Promise<Note> {
  const n: Note = { id: makeId(), createdAt: new Date().toISOString(), ...input }
  await mutate(d => ({ ...d, notes: [...d.notes, n] })); return n
}

// Milestones
export async function getMilestones(contactId: string): Promise<Milestone[]> {
  return (await load()).milestones.filter(m => m.contactId === contactId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
export async function createMilestone(input: MilestoneInput): Promise<Milestone> {
  const m: Milestone = { id: makeId(), createdAt: new Date().toISOString(), ...input }
  await mutate(d => ({ ...d, milestones: [...d.milestones, m] })); return m
}
export async function deleteMilestone(id: string): Promise<boolean> {
  let found = false
  await mutate(d => { found = d.milestones.some(m => m.id === id); return found ? { ...d, milestones: d.milestones.filter(m => m.id !== id) } : d })
  return found
}

// Insights
export async function getInsights(contactId: string): Promise<Insight[]> {
  return (await load()).insights.filter(i => i.contactId === contactId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
export async function saveInsight(input: Omit<Insight, "id" | "createdAt">): Promise<Insight> {
  const ins: Insight = { id: makeId(), createdAt: new Date().toISOString(), ...input }
  await mutate(d => ({ ...d, insights: [...d.insights, ins] })); return ins
}
