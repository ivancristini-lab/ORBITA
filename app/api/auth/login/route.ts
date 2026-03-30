import { NextRequest } from "next/server"
import { getUser } from "../../../../lib/store"
import { fail, ok } from "../../../../lib/api"
import { authLoginSchema } from "../../../../lib/validators"
export const dynamic = "force-dynamic"
export async function POST(req: NextRequest) {
  try {
    const b = await req.json(); const p = authLoginSchema.safeParse(b)
    if (!p.success) return fail(p.error.issues[0]?.message ?? "Invalid", 400)
    const user = await getUser()
    const sessionToken = `orbita_${Date.now()}_${Math.random().toString(36).slice(2)}`
    return ok({ user, sessionToken })
  } catch { return fail("Error logging in", 500) }
}
