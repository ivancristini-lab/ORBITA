import { NextRequest } from "next/server"
import { generateInsight } from "../../../../lib/ai"
import { getContact, getNotes, getUser, saveInsight } from "../../../../lib/store"
import { fail, ok } from "../../../../lib/api"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(req: NextRequest) {
  try {
    const { contactId } = await req.json()
    if (!contactId) return fail("contactId required", 400)
    const [contact, notes, user] = await Promise.all([getContact(contactId), getNotes(contactId), getUser()])
    if (!contact) return fail("Not found", 404)
    const data = await generateInsight(contact, notes, user.goal)
    const insight = await saveInsight(data)
    return ok({ insight }, 201)
  } catch (e) { console.error(e); return fail("Error generating insight", 500) }
}
