import { NextRequest } from "next/server"
import { createContact, getContacts } from "../../../lib/store"
import { fail, ok } from "../../../lib/api"
import { contactCreateSchema } from "../../../lib/validators"
import { generateInsight, getAiMode } from "../../../lib/ai"
import { getUser, saveInsight, getNotes } from "../../../lib/store"
export const dynamic = "force-dynamic"
export async function GET() { return ok({ contacts: await getContacts() }) }
export async function POST(req: NextRequest) {
  try {
    const b = await req.json(); const p = contactCreateSchema.safeParse(b)
    if (!p.success) return fail(p.error.issues[0]?.message ?? "Invalid", 400)
    const contact = await createContact(p.data)
    try {
      const [notes, user] = await Promise.all([getNotes(contact.id), getUser()])
      const insightData = await generateInsight(contact, notes, user.goal)
      await saveInsight(insightData)
    } catch {}
    return ok({ contact }, 201)
  } catch { return fail("Request inválida", 400) }
}
