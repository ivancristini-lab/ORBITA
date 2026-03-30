import { NextRequest } from "next/server"
import { getUser, updateUser } from "../../../lib/store"
import { fail, ok } from "../../../lib/api"
import { userUpdateSchema } from "../../../lib/validators"
export const dynamic = "force-dynamic"
export async function GET() { return ok({ user: await getUser() }) }
export async function PATCH(req: NextRequest) {
  try {
    const b = await req.json(); const p = userUpdateSchema.safeParse(b)
    if (!p.success) return fail(p.error.issues[0]?.message ?? "Invalid", 400)
    return ok({ user: await updateUser(p.data) })
  } catch { return fail("Request inválida", 400) }
}
