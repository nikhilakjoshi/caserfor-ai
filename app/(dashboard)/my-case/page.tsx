import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export default async function MyCasePage() {
  const user = await getUser()
  if (!user) redirect("/login")

  const client = await prisma.client.findFirst({
    where: { userId: user.id, status: { not: "draft" } },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  })

  if (!client) {
    redirect("/onboarding")
  }

  redirect(`/cases/${client.id}`)
}
