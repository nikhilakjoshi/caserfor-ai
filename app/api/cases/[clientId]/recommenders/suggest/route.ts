import { NextRequest, NextResponse } from "next/server"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"
import { suggestRecommenders } from "@/lib/recommender-suggester"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    // Lawyer-only
    if (result.user.role !== "lawyer" && result.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fire-and-forget
    suggestRecommenders(clientId).catch((err) => {
      console.error("Recommender suggestion failed:", err)
    })

    return NextResponse.json({ status: "processing" }, { status: 202 })
  } catch (error) {
    console.error("Error triggering recommender suggestions:", error)
    return NextResponse.json({ error: "Failed to trigger suggestions" }, { status: 500 })
  }
}
