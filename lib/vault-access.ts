import { prisma } from "@/lib/db"
import type { UserRole } from "@prisma/client"

/**
 * Check if a user can access a specific vault based on their role.
 * - applicant: only their own vault (via Client.vaultId)
 * - lawyer: only vaults for assigned cases
 * - admin: all vaults
 */
export async function canAccessVault(
  userId: string,
  role: UserRole,
  vaultId: string
): Promise<boolean> {
  if (role === "admin") return true

  if (role === "applicant") {
    const client = await prisma.client.findFirst({
      where: { userId, vaultId },
      select: { id: true },
    })
    return !!client
  }

  if (role === "lawyer") {
    const client = await prisma.client.findFirst({
      where: { vaultId, status: { not: "draft" } },
      select: { id: true },
    })
    return !!client
  }

  return false
}
