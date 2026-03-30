import { NextResponse } from "next/server"
import { getAiMode } from "../../../lib/ai"
export const dynamic = "force-dynamic"
export async function GET() {
  return NextResponse.json({ status: "ok", aiMode: getAiMode(), timestamp: new Date().toISOString(), version: "3.0.0" })
}
