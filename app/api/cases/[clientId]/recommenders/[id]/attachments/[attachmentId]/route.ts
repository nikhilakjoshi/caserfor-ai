import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"
import { deleteFile } from "@/lib/s3"

type Params = {
  params: Promise<{ clientId: string; id: string; attachmentId: string }>
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { clientId, id, attachmentId } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const attachment = await prisma.recommenderAttachment.findFirst({
      where: { id: attachmentId, recommenderId: id },
    })
    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }

    // Verify recommender belongs to this client
    const recommender = await prisma.recommender.findFirst({
      where: { id, clientId },
    })
    if (!recommender) {
      return NextResponse.json({ error: "Recommender not found" }, { status: 404 })
    }

    await deleteFile(attachment.storageKey)
    await prisma.recommenderAttachment.delete({ where: { id: attachmentId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting attachment:", error)
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 })
  }
}
