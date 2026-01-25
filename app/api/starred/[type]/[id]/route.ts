import { NextRequest, NextResponse } from "next/server"

// DELETE /api/starred/[type]/[id] - Remove starred item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type: itemType, id: itemId } = await params

  if (itemType !== "prompt" && itemType !== "example") {
    return NextResponse.json(
      { error: "Invalid item type. Must be 'prompt' or 'example'" },
      { status: 400 }
    )
  }

  // TODO: Get userId from auth session
  const userId = "mock-user-id"

  // TODO: Replace with Prisma delete
  // const deleted = await prisma.starredItem.deleteMany({
  //   where: {
  //     userId,
  //     itemType,
  //     itemId,
  //   },
  // })
  //
  // if (deleted.count === 0) {
  //   return NextResponse.json(
  //     { error: "Starred item not found" },
  //     { status: 404 }
  //   )
  // }

  // For mock implementation, we can't actually delete from the in-memory array
  // in the other file, so we just return success
  // In production with Prisma, this would actually delete

  return NextResponse.json({ success: true, itemType, itemId, userId })
}

// GET /api/starred/[type]/[id] - Check if item is starred
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type: itemType, id: itemId } = await params

  if (itemType !== "prompt" && itemType !== "example") {
    return NextResponse.json(
      { error: "Invalid item type. Must be 'prompt' or 'example'" },
      { status: 400 }
    )
  }

  // TODO: Get userId from auth session
  const userId = "mock-user-id"

  // TODO: Replace with Prisma query
  // const starred = await prisma.starredItem.findUnique({
  //   where: {
  //     userId_itemType_itemId: {
  //       userId,
  //       itemType,
  //       itemId,
  //     },
  //   },
  // })

  // Mock: always return not starred since we can't share state
  return NextResponse.json({ starred: false, itemType, itemId })
}
