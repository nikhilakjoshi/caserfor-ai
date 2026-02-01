import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"
import { deleteFile } from "@/lib/s3"
import { deleteNamespace, vaultNamespace } from "@/lib/pinecone"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { clientId } = await params

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: user.id },
      include: { vault: { include: { documents: true } } },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Delete S3 files
    if (client.vault?.documents) {
      for (const doc of client.vault.documents) {
        if (doc.storageKey) {
          try {
            await deleteFile(doc.storageKey)
          } catch (e) {
            console.error(`Failed to delete S3 file ${doc.storageKey}:`, e)
          }
        }
      }
    }

    // Delete Pinecone namespace
    if (client.vaultId) {
      try {
        await deleteNamespace(vaultNamespace(client.vaultId))
      } catch (e) {
        console.error(`Failed to delete Pinecone namespace:`, e)
      }
    }

    // Delete DB records: criterion responses, eligibility report, documents
    await prisma.criterionResponse.deleteMany({ where: { clientId } })
    await prisma.eligibilityReport.deleteMany({ where: { clientId } })
    if (client.vaultId) {
      await prisma.document.deleteMany({ where: { vaultId: client.vaultId } })
    }

    // Reset client fields - use Record to handle all fields including expanded ones
    const resetData: Record<string, unknown> = {
      firstName: null,
      lastName: null,
      email: null,
      phone: null,
      dateOfBirth: null,
      citizenship: null,
      fieldOfExpertise: null,
      education: Prisma.DbNull,
      currentEmployer: null,
      usIntentType: null,
      usIntentDetails: null,
      hasMajorAchievement: null,
      majorAchievementDetails: null,
      socialFollowing: null,
      keynotes: null,
      recommenders: Prisma.DbNull,
      selfAssessment: null,
      standingLevel: null,
      recognitionScope: null,
      evidenceChecklist: Prisma.DbNull,
      urgency: null,
      idealTimeline: null,
      priorConsultations: null,
      altCategories: Prisma.DbNull,
      consentToProcess: null,
      currentImmigrationStatus: null,
      desiredStatus: null,
      previousApplications: null,
      urgencyReason: null,
      specialCircumstances: null,
      communicationPreference: null,
      timezone: null,
      currentStep: 1,
      status: "draft",
    }
    await prisma.client.update({
      where: { id: clientId },
      data: resetData as Parameters<typeof prisma.client.update>[0]["data"],
    })

    // Reset vault name
    if (client.vaultId) {
      const dateStr = new Date().toISOString().split("T")[0]
      await prisma.vault.update({
        where: { id: client.vaultId },
        data: { name: `Intake - ${dateStr}` },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to reset onboarding:", error)
    return NextResponse.json(
      { error: "Failed to reset onboarding" },
      { status: 500 }
    )
  }
}
