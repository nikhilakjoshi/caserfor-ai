import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (user.role !== "lawyer" && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get("tab") || "all"
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = 20

    // Build where clause based on tab
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (tab === "mine") {
      where.caseAssignments = { some: { lawyerId: user.id } }
    } else if (tab === "unassigned") {
      where.caseAssignments = { none: {} }
    }
    // "all" = no assignment filter

    // Only show submitted+ clients (not drafts)
    where.status = { not: "draft" }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { fieldOfExpertise: { contains: search, mode: "insensitive" } },
      ]
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          eligibilityReport: { select: { verdict: true } },
          caseAssignments: {
            select: {
              lawyerId: true,
              lawyer: { select: { name: true } },
            },
          },
          criterionResponses: { select: { id: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.client.count({ where }),
    ])

    const cases = clients.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      fieldOfExpertise: c.fieldOfExpertise,
      status: c.status,
      verdict: c.eligibilityReport?.verdict ?? null,
      criteriaCount: c.criterionResponses.length,
      assignedTo: c.caseAssignments.map((a) => ({
        lawyerId: a.lawyerId,
        lawyerName: a.lawyer.name,
      })),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))

    return NextResponse.json({
      cases,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching cases:", error)
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    )
  }
}
