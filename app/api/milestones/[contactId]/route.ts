import { NextRequest } from "next/server"
import { createMilestone, getMilestones, deleteMilestone } from "../../../../lib/store"
import { milestoneCreateSchema } from "../../../../lib/validators"
import { fail, ok } from "../../../../lib/api"
export const dynamic = "force-dynamic"
export async function GET(_req: NextRequest, { params }: { params: { contactId: string } }) {
  return ok({ milestones: await getMilestones(params.contactId) })
}
export async function POST(req: NextRequest, { params }: { params: { contactId: string } }) {
  try {
    const b = await req.json(); const p = milestoneCreateSchema.safeParse({ ...b, contactId: params.contactId })
    if (!p.success) return fail(p.error.issues[0]?.message ?? "Invalid", 400)
    const m = await createMilestone(p.data); return ok({ milestone: m }, 201)
  } catch { return fail("Request inválida", 400) }
}
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json(); const d = await deleteMilestone(id); return ok({ deleted: d })
  } catch { return fail("Request inválida", 400) }
}
