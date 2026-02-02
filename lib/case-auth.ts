import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"
import type { UserRole } from "@prisma/client"

interface CaseAuthResult {
  user: { id: string; email: string; name: string; role: UserRole }
  client: { id: string; userId: string; vaultId: string | null }
}

/**
 * Verify auth + role-based access for case-scoped routes.
 * Lawyer: must have CaseAssignment. Applicant: must own the client record. Admin: full access.
 * Returns { user, client } or a NextResponse error (401/403/404).
 */
export async function authorizeCaseAccess(
  clientId: string
): Promise<CaseAuthResult | NextResponse> {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, userId: true, vaultId: true },
  })

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
  }

  if (user.role === "admin") {
    return { user, client }
  }

  if (user.role === "lawyer") {
    const assignment = await prisma.caseAssignment.findFirst({
      where: { lawyerId: user.id, clientId },
      select: { id: true },
    })
    if (!assignment) {
      return NextResponse.json(
        { error: "Not assigned to this case" },
        { status: 403 }
      )
    }
    return { user, client }
  }

  if (user.role === "applicant") {
    if (client.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return { user, client }
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

/** Type guard: true if authorizeCaseAccess returned an error response */
export function isAuthError(
  result: CaseAuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse
}
