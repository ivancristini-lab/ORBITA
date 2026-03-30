import { NextRequest } from "next/server"
import { contactUpdateSchema } from "../../../../lib/validators"
import { deleteContact, getContact, updateContact } from "../../../../lib/store"
import { fail, ok } from "../../../../lib/api"
export const dynamic = "force-dynamic"
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const c = await getContact(params.id); if (!c) return fail("Not found", 404); return ok({ contact: c })
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const b = await req.json(); const p = contactUpdateSchema.safeParse(b)
    if (!p.success) return fail(p.error.issues[0]?.message ?? "Invalid", 400)
    const c = await updateContact(params.id, p.data); if (!c) return fail("Not found", 404); return ok({ contact: c })
  } catch { return fail("Request inválida", 400) }
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ok2 = await deleteContact(params.id); if (!ok2) return fail("Not found", 404); return ok({ deleted: true })
}
