import { NextRequest } from "next/server"
import { updateUser } from "../../../../lib/store"
import { fail, ok } from "../../../../lib/api"
import { authRegisterSchema } from "../../../../lib/validators"
export const dynamic = "force-dynamic"
export async function POST(req: NextRequest) {
  try {
    const b = await req.json(); const p = authRegisterSchema.safeParse(b)
    if (!p.success) return fail(p.error.issues[0]?.message ?? "Invalid", 400)
    const user = await updateUser({ name: p.data.name, email: p.data.email, goal: p.data.goal })
    const sessionToken = `orbita_${Date.now()}_${Math.random().toString(36).slice(2)}`
    return ok({ user, sessionToken }, 201)
  } catch { return fail("Error registering", 500) }
}
