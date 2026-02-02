import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"

const createSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  organization: z.string().optional(),
  relationship: z.string().optional(),
  linkedinUrl: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const recommenders = await prisma.recommender.findMany({
      where: { clientId },
      include: { _count: { select: { attachments: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(recommenders)
  } catch (error) {
    console.error("Error fetching recommenders:", error)
    return NextResponse.json({ error: "Failed to fetch recommenders" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const recommender = await prisma.recommender.create({
      data: { clientId, ...parsed.data },
    })

    return NextResponse.json(recommender, { status: 201 })
  } catch (error) {
    console.error("Error creating recommender:", error)
    return NextResponse.json({ error: "Failed to create recommender" }, { status: 500 })
  }
}
