import { NextRequest, NextResponse } from "next/server"

// GET /api/examples - List examples
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ownerType = searchParams.get("ownerType") // system | personal
  const search = searchParams.get("search")

  // TODO: Replace with Prisma query when DATABASE_URL is set
  // const examples = await prisma.example.findMany({
  //   where: {
  //     ...(ownerType && { ownerType }),
  //     ...(search && {
  //       OR: [
  //         { name: { contains: search, mode: 'insensitive' } },
  //         { promptText: { contains: search, mode: 'insensitive' } },
  //       ],
  //     }),
  //   },
  //   orderBy: { createdAt: 'desc' },
  // })

  // Mock data for now
  const mockExamples = [
    {
      id: "1",
      name: "NDA Summary Example",
      promptText: "Summarize the key terms of this NDA",
      documentRef: "Sample_NDA_2026.pdf",
      response: "This Non-Disclosure Agreement between Acme Corp and Beta Inc establishes mutual confidentiality obligations for a period of 3 years. Key terms include: (1) Definition of confidential information covers technical, business, and financial data; (2) Standard exclusions for public information and prior knowledge; (3) Permitted disclosure to employees and contractors on need-to-know basis; (4) Return/destruction of materials upon termination.",
      ownerType: "system",
      createdAt: "2026-01-10T00:00:00.000Z",
    },
    {
      id: "2",
      name: "Covenant Extraction Example",
      promptText: "Extract all financial covenants from this credit agreement",
      documentRef: "Credit_Agreement_Draft.pdf",
      response: "Financial Covenants identified:\n1. Minimum Interest Coverage Ratio: 3.0x\n2. Maximum Leverage Ratio: 4.5x declining to 3.5x by Year 3\n3. Minimum Liquidity: $50M\n4. Maximum Capital Expenditures: $25M annually\n5. Restricted Payments basket: $10M per fiscal year",
      ownerType: "system",
      createdAt: "2026-01-12T00:00:00.000Z",
    },
    {
      id: "3",
      name: "Risk Assessment Example",
      promptText: "Identify key risks in this employment agreement",
      documentRef: "Employment_Agreement_Template.pdf",
      response: "Key risks identified:\n\nHIGH:\n- Non-compete clause may be unenforceable in California\n- Intellectual property assignment clause overly broad\n\nMEDIUM:\n- Severance terms favor employer significantly\n- Change of control provisions unclear\n\nLOW:\n- Minor inconsistencies in defined terms\n- Standard arbitration clause present",
      ownerType: "system",
      createdAt: "2026-01-14T00:00:00.000Z",
    },
  ]

  let filteredExamples = mockExamples

  if (ownerType) {
    filteredExamples = filteredExamples.filter((e) => e.ownerType === ownerType)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    filteredExamples = filteredExamples.filter(
      (e) =>
        e.name.toLowerCase().includes(searchLower) ||
        e.promptText.toLowerCase().includes(searchLower)
    )
  }

  return NextResponse.json(filteredExamples)
}
