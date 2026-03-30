import { z } from "zod"
export const contactCreateSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  company: z.string().max(120).default(""),
  tags: z.array(z.string().max(50)).default([]),
  daysSinceContact: z.number().int().min(0).max(3650).default(0),
  linkedin: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
})
export const contactUpdateSchema = contactCreateSchema.partial()
export const noteCreateSchema = z.object({ contactId: z.string().min(1), content: z.string().min(1).max(5000) })
export const milestoneCreateSchema = z.object({
  contactId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  date: z.string().min(1),
  type: z.enum(["meeting", "email", "call", "deal", "intro", "event", "other"]).default("other"),
})
export const contactIdSchema = z.object({ contactId: z.string().min(1) })
export const userUpdateSchema = z.object({
  goal: z.string().max(500).optional(),
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  theme: z.enum(["dark", "light"]).optional(),
})
export const authRegisterSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  goal: z.string().min(1).max(500),
})
export const authLoginSchema = z.object({ email: z.string().email() })
