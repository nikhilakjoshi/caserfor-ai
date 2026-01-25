import { NextRequest, NextResponse } from "next/server"

// Mock starred items storage (in-memory for now)
// TODO: Replace with Prisma when DATABASE_URL is set
const starredItems: {
  id: string
  userId: string
  itemType: "prompt" | "example"
  itemId: string
  createdAt: string
}[] = []

// GET /api/starred - List starred items for user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const itemType = searchParams.get("itemType") as "prompt" | "example" | null

  // TODO: Get userId from auth session
  const userId = "mock-user-id"

  // TODO: Replace with Prisma query
  // const starred = await prisma.starredItem.findMany({
  //   where: {
  //     userId,
  //     ...(itemType && { itemType }),
  //   },
  //   orderBy: { createdAt: 'desc' },
  // })

  let filtered = starredItems.filter((s) => s.userId === userId)
  if (itemType) {
    filtered = filtered.filter((s) => s.itemType === itemType)
  }

  return NextResponse.json(filtered)
}

// POST /api/starred - Add starred item
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { itemType, itemId } = body

  if (!itemType || !itemId) {
    return NextResponse.json(
      { error: "itemType and itemId are required" },
      { status: 400 }
    )
  }

  if (itemType !== "prompt" && itemType !== "example") {
    return NextResponse.json(
      { error: "itemType must be 'prompt' or 'example'" },
      { status: 400 }
    )
  }

  // TODO: Get userId from auth session
  const userId = "mock-user-id"

  // Check for duplicate (unique constraint)
  const existing = starredItems.find(
    (s) => s.userId === userId && s.itemType === itemType && s.itemId === itemId
  )

  if (existing) {
    return NextResponse.json(
      { error: "Item already starred" },
      { status: 409 }
    )
  }

  // TODO: Replace with Prisma create
  // const starred = await prisma.starredItem.create({
  //   data: {
  //     userId,
  //     itemType,
  //     itemId,
  //   },
  // })

  const newStarred = {
    id: String(Date.now()),
    userId,
    itemType,
    itemId,
    createdAt: new Date().toISOString(),
  }

  starredItems.push(newStarred)

  return NextResponse.json(newStarred, { status: 201 })
}
