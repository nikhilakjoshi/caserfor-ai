import { NextRequest, NextResponse } from "next/server"
import { runEvaluation } from "@/lib/eb1a-evaluator"

export const maxDuration = 300

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 })
  }

  // Run evaluation (non-blocking when called via fire-and-forget)
  try {
    await runEvaluation(clientId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Evaluation endpoint error:", error)
    return NextResponse.json(
      { error: "Evaluation failed" },
      { status: 500 }
    )
  }
}
