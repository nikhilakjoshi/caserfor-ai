import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const type = searchParams.get("type")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom)
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo)
    }

    const historyEntries = await prisma.historyEntry.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { sourcesSummary: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(Object.keys(dateFilter).length > 0
          ? { createdAt: dateFilter }
          : {}),
        ...(type ? { type } : {}),
      },
      include: {
        query: {
          select: {
            id: true,
            inputText: true,
            outputText: true,
            outputType: true,
            sources: {
              select: {
                id: true,
                sourceType: true,
                sourceId: true,
                sourceName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get total count for pagination
    const totalCount = await prisma.historyEntry.count({
      where: {
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { sourcesSummary: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(Object.keys(dateFilter).length > 0
          ? { createdAt: dateFilter }
          : {}),
        ...(type ? { type } : {}),
      },
    })

    const response = historyEntries.map((entry) => ({
      id: entry.id,
      queryId: entry.queryId,
      title: entry.title,
      type: entry.query.outputType,
      sourcesSummary: entry.sourcesSummary,
      createdAt: entry.createdAt.toISOString(),
      inputText: entry.query.inputText,
      outputText: entry.query.outputText,
      sources: entry.query.sources,
    }))

    return NextResponse.json({
      entries: response,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch history:", error)
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    )
  }
}
