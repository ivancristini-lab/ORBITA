import { NextRequest } from "next/server"
import { getInsights } from "../../../../lib/store"
import { fail, ok } from "../../../../lib/api"
export const dynamic = "force-dynamic"
export async function GET(_req: NextRequest, { params }: { params: { contactId: string } }) {
  return ok({ insights: await getInsights(params.contactId) })
}
