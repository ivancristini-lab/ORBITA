import { NextRequest } from "next/server"
import { generateMessage } from "../../../lib/ai"
import { getContact, getInsights, getNotes, getUser } from "../../../lib/store"
import { fail, ok } from "../../../lib/api"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(req: NextRequest) {
  try {
    const { contactId } = await req.json()
    if (!contactId) return fail("contactId required", 400)
    const [contact, notes, insights, user] = await Promise.all([getContact(contactId), getNotes(contactId), getInsights(contactId), getUser()])
    if (!contact) return fail("Not found", 404)
    const msg = await generateMessage(contact, notes, insights[0] ?? null, user.name, user.goal)
    return ok({ message: msg })
  } catch (e) { console.error(e); return fail("Error generating message", 500) }
}
