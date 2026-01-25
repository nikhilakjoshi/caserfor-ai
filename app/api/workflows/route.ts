import { NextRequest, NextResponse } from "next/server"

// Mock workflows - same as UI to stay consistent until DB connected
const mockWorkflows = [
  // General category
  {
    id: "1",
    name: "Draft Client Alert",
    description: "Generate client-facing alerts from source documents",
    category: "General",
    outputType: "draft",
    stepCount: 3,
    isSystem: true,
    isActive: true,
  },
  {
    id: "2",
    name: "Draft from Template",
    description: "Create documents using predefined templates",
    category: "General",
    outputType: "draft",
    stepCount: 4,
    isSystem: true,
    isActive: true,
  },
  {
    id: "3",
    name: "Extract Timeline",
    description: "Pull chronological events from documents",
    category: "General",
    outputType: "extraction",
    columnCount: 5,
    isSystem: true,
    isActive: true,
  },
  {
    id: "4",
    name: "Proofread",
    description: "Check for grammar, style, and consistency issues",
    category: "General",
    outputType: "draft",
    stepCount: 2,
    isSystem: true,
    isActive: true,
  },
  {
    id: "5",
    name: "Summarize Calls",
    description: "Create summaries from meeting transcripts",
    category: "General",
    outputType: "draft",
    stepCount: 3,
    isSystem: true,
    isActive: true,
  },
  {
    id: "6",
    name: "Transcribe Audio",
    description: "Convert audio recordings to text",
    category: "General",
    outputType: "draft",
    stepCount: 2,
    isSystem: true,
    isActive: true,
  },
  {
    id: "7",
    name: "Translate",
    description: "Translate documents to different languages",
    category: "General",
    outputType: "transformation",
    stepCount: 2,
    isSystem: true,
    isActive: true,
  },
  // Transactional category
  {
    id: "8",
    name: "Analyze Change of Control",
    description: "Review change of control provisions across agreements",
    category: "Transactional",
    outputType: "review_table",
    columnCount: 8,
    isSystem: true,
    isActive: true,
  },
  {
    id: "9",
    name: "Draft Covenants Memo",
    description: "Summarize covenant provisions from credit agreements",
    category: "Transactional",
    outputType: "draft",
    stepCount: 4,
    isSystem: true,
    isActive: true,
  },
  {
    id: "10",
    name: "Draft Item 1.01",
    description: "Create 8-K Item 1.01 disclosure draft",
    category: "Transactional",
    outputType: "draft",
    stepCount: 3,
    isSystem: true,
    isActive: true,
  },
  {
    id: "11",
    name: "Extract Key Data",
    description: "Pull structured data from agreements",
    category: "Transactional",
    outputType: "extraction",
    columnCount: 12,
    isSystem: true,
    isActive: true,
  },
  {
    id: "12",
    name: "Extract Terms from Agreements",
    description: "Identify and extract key terms and definitions",
    category: "Transactional",
    outputType: "review_table",
    columnCount: 6,
    isSystem: true,
    isActive: true,
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get("category")
  const outputType = searchParams.get("outputType")
  const search = searchParams.get("search")
  const isSystem = searchParams.get("isSystem")

  let workflows = [...mockWorkflows]

  // Filter by category
  if (category && category !== "all") {
    workflows = workflows.filter((w) => w.category === category)
  }

  // Filter by outputType
  if (outputType && outputType !== "all") {
    workflows = workflows.filter((w) => w.outputType === outputType)
  }

  // Filter by isSystem
  if (isSystem !== null) {
    const systemOnly = isSystem === "true"
    workflows = workflows.filter((w) => w.isSystem === systemOnly)
  }

  // Filter by search query
  if (search) {
    const query = search.toLowerCase()
    workflows = workflows.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.description.toLowerCase().includes(query)
    )
  }

  // TODO: Replace with Prisma query when DB connected
  // const workflows = await prisma.workflow.findMany({
  //   where: {
  //     isActive: true,
  //     ...(category && category !== "all" && { category }),
  //     ...(outputType && outputType !== "all" && { outputType }),
  //     ...(isSystem !== null && { isSystem: isSystem === "true" }),
  //     ...(search && {
  //       OR: [
  //         { name: { contains: search, mode: "insensitive" } },
  //         { description: { contains: search, mode: "insensitive" } },
  //       ],
  //     }),
  //   },
  //   orderBy: [{ category: "asc" }, { name: "asc" }],
  //   include: { steps: true },
  // })

  return NextResponse.json(workflows)
}
