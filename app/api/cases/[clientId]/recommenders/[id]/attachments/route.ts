import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"
import { uploadFile } from "@/lib/s3"
import { randomUUID } from "crypto"

type Params = { params: Promise<{ clientId: string; id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { clientId, id } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const recommender = await prisma.recommender.findFirst({
      where: { id, clientId },
    })
    if (!recommender) {
      return NextResponse.json({ error: "Recommender not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "bin"
    const storageKey = `recommenders/${id}/${randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    await uploadFile(storageKey, buffer, file.type)

    const attachment = await prisma.recommenderAttachment.create({
      data: {
        recommenderId: id,
        name: file.name,
        fileType: file.type,
        storageKey,
      },
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error("Error uploading attachment:", error)
    return NextResponse.json({ error: "Failed to upload attachment" }, { status: 500 })
  }
}
