import { NextRequest, NextResponse } from "next/server"

// GET /api/prompts - List prompts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ownerType = searchParams.get("ownerType") // system | personal
  const category = searchParams.get("category")
  const search = searchParams.get("search")

  // TODO: Replace with Prisma query when DATABASE_URL is set
  // const prompts = await prisma.prompt.findMany({
  //   where: {
  //     ...(ownerType && { ownerType }),
  //     ...(category && { category }),
  //     ...(search && {
  //       OR: [
  //         { name: { contains: search, mode: 'insensitive' } },
  //         { content: { contains: search, mode: 'insensitive' } },
  //       ],
  //     }),
  //     isActive: true,
  //   },
  //   orderBy: { createdAt: 'desc' },
  // })

  // Mock data for now
  const mockPrompts = [
    {
      id: "1",
      name: "Contract Summary",
      content: "Summarize the key terms of this contract including parties, effective date, term, and material obligations.",
      ownerType: "system",
      category: "analysis",
      isActive: true,
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
    },
    {
      id: "2",
      name: "Risk Identification",
      content: "Identify and list all potential legal risks in this document, categorized by severity (high, medium, low).",
      ownerType: "system",
      category: "review",
      isActive: true,
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
    },
    {
      id: "3",
      name: "Change of Control Analysis",
      content: "Analyze all change of control provisions and their implications for the transaction.",
      ownerType: "system",
      category: "transactional",
      isActive: true,
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
    },
  ]

  let filteredPrompts = mockPrompts

  if (ownerType) {
    filteredPrompts = filteredPrompts.filter((p) => p.ownerType === ownerType)
  }

  if (category) {
    filteredPrompts = filteredPrompts.filter((p) => p.category === category)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    filteredPrompts = filteredPrompts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.content.toLowerCase().includes(searchLower)
    )
  }

  return NextResponse.json(filteredPrompts)
}

// POST /api/prompts - Create personal prompt
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, content, category } = body

  if (!name || !content) {
    return NextResponse.json(
      { error: "Name and content are required" },
      { status: 400 }
    )
  }

  // TODO: Replace with Prisma create when DATABASE_URL is set
  // const prompt = await prisma.prompt.create({
  //   data: {
  //     name,
  //     content,
  //     category,
  //     ownerType: 'personal',
  //     userId: session.user.id, // From auth
  //     isActive: true,
  //   },
  // })

  const newPrompt = {
    id: String(Date.now()),
    name,
    content,
    ownerType: "personal",
    category: category || null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json(newPrompt, { status: 201 })
}
