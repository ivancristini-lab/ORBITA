import { NextRequest } from "next/server"
import { createNote, getNotes } from "../../../../lib/store"
import { fail, ok } from "../../../../lib/api"
export const dynamic = "force-dynamic"
export async function GET(_req: NextRequest, { params }: { params: { contactId: string } }) {
  return ok({ notes: await getNotes(params.contactId) })
}
export async function POST(req: NextRequest, { params }: { params: { contactId: string } }) {
  try {
    const b = await req.json()
    const note = await createNote({ contactId: params.contactId, content: String(b.content ?? "") })
    return ok({ note }, 201)
  } catch { return fail("Request inválida", 400) }
}
