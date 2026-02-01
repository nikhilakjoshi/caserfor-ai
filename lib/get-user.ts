import { auth } from "@/lib/auth"
import type { UserRole } from "@prisma/client"

export async function getUser(): Promise<{
  id: string
  email: string
  name: string
  role: UserRole
} | null> {
  const session = await auth()
  if (!session?.user) return null
  return session.user
}

export async function requireUser() {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")
  return user
}
