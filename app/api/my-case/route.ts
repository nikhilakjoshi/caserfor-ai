import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the most recent non-draft client for this user
    const client = await prisma.client.findFirst({
      where: { userId: user.id, status: { not: "draft" } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        fieldOfExpertise: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "No case found" }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
