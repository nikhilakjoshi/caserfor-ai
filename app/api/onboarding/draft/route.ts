import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Find existing draft client
    let client = await prisma.client.findFirst({
      where: { userId: user.id, status: "draft" },
      include: { vault: true },
    })

    if (client) {
      return NextResponse.json(client)
    }

    // Create new draft client with auto-created vault
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0]

    const vault = await prisma.vault.create({
      data: {
        name: `Intake - ${dateStr}`,
        description: "Auto-created vault for client intake documents",
        type: "knowledge_base",
      },
    })

    client = await prisma.client.create({
      data: {
        userId: user.id,
        vaultId: vault.id,
        currentStep: 1,
        status: "draft",
      },
      include: { vault: true },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error("Failed to get/create draft:", error)
    return NextResponse.json(
      { error: "Failed to get/create draft" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()

    const client = await prisma.client.findFirst({
      where: { userId: user.id, status: "draft" },
    })

    if (!client) {
      return NextResponse.json(
        { error: "No draft client found" },
        { status: 404 }
      )
    }

    // Extract updatable fields
    const {
      firstName, lastName, email, phone, dateOfBirth, citizenship,
      fieldOfExpertise, education, currentEmployer,
      usIntentType, usIntentDetails,
      hasMajorAchievement, majorAchievementDetails,
      socialFollowing, keynotes, recommenders,
      selfAssessment, standingLevel, recognitionScope,
      evidenceChecklist, urgency, idealTimeline, priorConsultations,
      altCategories, currentStep,
    } = body

    const data: Record<string, unknown> = {}

    if (firstName !== undefined) data.firstName = firstName
    if (lastName !== undefined) data.lastName = lastName
    if (email !== undefined) data.email = email
    if (phone !== undefined) data.phone = phone
    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null
    if (citizenship !== undefined) data.citizenship = citizenship
    if (fieldOfExpertise !== undefined) data.fieldOfExpertise = fieldOfExpertise
    if (education !== undefined) data.education = education
    if (currentEmployer !== undefined) data.currentEmployer = currentEmployer
    if (usIntentType !== undefined) data.usIntentType = usIntentType
    if (usIntentDetails !== undefined) data.usIntentDetails = usIntentDetails
    if (hasMajorAchievement !== undefined) data.hasMajorAchievement = hasMajorAchievement
    if (majorAchievementDetails !== undefined) data.majorAchievementDetails = majorAchievementDetails
    if (socialFollowing !== undefined) data.socialFollowing = socialFollowing
    if (keynotes !== undefined) data.keynotes = keynotes
    if (recommenders !== undefined) data.recommenders = recommenders
    if (selfAssessment !== undefined) data.selfAssessment = selfAssessment
    if (standingLevel !== undefined) data.standingLevel = standingLevel
    if (recognitionScope !== undefined) data.recognitionScope = recognitionScope
    if (evidenceChecklist !== undefined) data.evidenceChecklist = evidenceChecklist
    if (urgency !== undefined) data.urgency = urgency
    if (idealTimeline !== undefined) data.idealTimeline = idealTimeline
    if (priorConsultations !== undefined) data.priorConsultations = priorConsultations
    if (altCategories !== undefined) data.altCategories = altCategories
    if (currentStep !== undefined) data.currentStep = currentStep

    // Update vault name if name fields provided
    if ((firstName || lastName) && client.vaultId) {
      const updatedClient = await prisma.client.findUnique({
        where: { id: client.id },
      })
      const fName = firstName ?? updatedClient?.firstName ?? ""
      const lName = lastName ?? updatedClient?.lastName ?? ""
      if (fName || lName) {
        const dateStr = client.createdAt.toISOString().split("T")[0]
        await prisma.vault.update({
          where: { id: client.vaultId },
          data: { name: `Intake - ${fName} ${lName} - ${dateStr}`.trim() },
        })
      }
    }

    const updated = await prisma.client.update({
      where: { id: client.id },
      data,
      include: { vault: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update draft:", error)
    return NextResponse.json(
      { error: "Failed to update draft" },
      { status: 500 }
    )
  }
}
