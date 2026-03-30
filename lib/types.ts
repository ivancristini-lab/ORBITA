export type InsightType = "opportunity" | "warning" | "priority"
export type Theme = "dark" | "light"

export interface User {
  id: string
  name: string
  email: string
  goal: string
  theme: Theme
  createdAt: string
}

export interface Contact {
  id: string
  userId: string
  name: string
  role: string
  company: string
  tags: string[]
  daysSinceContact: number
  linkedin?: string
  phone?: string
  notes_count?: number
  createdAt: string
}

export type ContactInput = Omit<Contact, "id" | "createdAt" | "userId" | "notes_count">
export type ContactUpdateInput = Partial<ContactInput>

export interface Note {
  id: string
  contactId: string
  content: string
  createdAt: string
}

export interface Milestone {
  id: string
  contactId: string
  title: string
  description: string
  date: string
  type: "meeting" | "email" | "call" | "deal" | "intro" | "event" | "other"
  createdAt: string
}

export type NoteInput = Pick<Note, "contactId" | "content">
export type MilestoneInput = Omit<Milestone, "id" | "createdAt">

export interface Insight {
  id: string
  contactId: string
  type: InsightType
  message: string
  suggestedAction: string
  score: number
  createdAt: string
}

export interface ContactWithInsight extends Contact {
  latestInsight: Insight | null
  notesCount: number
}

export interface HealthResponse {
  status: string
  aiMode: "gemini" | "anthropic" | "openai" | "fallback"
  timestamp: string
}
