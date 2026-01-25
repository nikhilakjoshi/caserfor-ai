import { streamText } from "ai"
import { defaultModel, analysisModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import type { AssistantQuery, QueryOutputType, SourceType } from "@prisma/client"

// TODO: Replace with actual auth when implemented
const MOCK_USER_ID = "mock-user-id"

export async function POST(req: Request) {
  const { inputText, outputType, sources, deepAnalysis, conversationId } =
    await req.json()

  if (!inputText?.trim()) {
    return new Response(JSON.stringify({ error: "inputText is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const startTime = Date.now()

  // Map string outputType to enum
  const queryOutputType: QueryOutputType =
    outputType === "draft"
      ? "draft"
      : outputType === "review_table"
        ? "review_table"
        : "chat"

  // Create query record with pending status
  let query: AssistantQuery | null = null
  try {
    query = await prisma.assistantQuery.create({
      data: {
        userId: MOCK_USER_ID,
        conversationId: conversationId || undefined,
        inputText,
        outputType: queryOutputType,
        deepAnalysis: Boolean(deepAnalysis),
        status: "pending",
      },
    })

    const queryId = query.id

    // Create source references if provided
    if (sources?.length > 0) {
      await prisma.sourceReference.createMany({
        data: sources.map(
          (s: { id: string; name: string; type?: string }) => ({
            queryId,
            sourceType: (s.type as SourceType) || "vault",
            sourceId: s.id,
            sourceName: s.name,
          })
        ),
      })
    }

    // Update status to streaming
    await prisma.assistantQuery.update({
      where: { id: queryId },
      data: { status: "streaming" },
    })
  } catch (error) {
    // If DB fails, continue without persistence (graceful degradation)
    console.error("Failed to create query record:", error)
    query = null
  }

  const model = deepAnalysis ? analysisModel : defaultModel

  // Build system prompt based on output type
  let systemPrompt = "You are a legal document assistant. "

  if (outputType === "draft") {
    systemPrompt +=
      "Generate well-structured, professional document drafts. Use clear headings, proper formatting, and professional legal language."
  } else if (outputType === "review_table") {
    systemPrompt +=
      "Extract and organize information into a structured table format. Use markdown tables with clear column headers."
  } else {
    systemPrompt +=
      "Provide helpful, accurate responses to legal research questions."
  }

  // Add source context if provided
  let userPrompt = inputText
  if (sources?.length > 0) {
    const sourceNames = sources.map((s: { name: string }) => s.name).join(", ")
    userPrompt = `Context: Using sources from: ${sourceNames}\n\nQuery: ${inputText}`
  }

  const result = streamText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    async onFinish({ text, usage }) {
      if (!query) return

      const latencyMs = Date.now() - startTime

      try {
        // Update query with completed status and output
        await prisma.assistantQuery.update({
          where: { id: query.id },
          data: {
            outputText: text,
            tokenCount: usage?.totalTokens,
            latencyMs,
            status: "completed",
          },
        })

        // Create history entry
        const title =
          inputText.length > 50 ? inputText.substring(0, 50) + "..." : inputText
        const sourcesSummary =
          sources?.length > 0
            ? sources.map((s: { name: string }) => s.name).join(", ")
            : null

        await prisma.historyEntry.create({
          data: {
            userId: MOCK_USER_ID,
            queryId: query.id,
            title,
            type: queryOutputType,
            sourcesSummary,
          },
        })
      } catch (error) {
        console.error("Failed to update query record:", error)
        // Try to mark as failed
        try {
          await prisma.assistantQuery.update({
            where: { id: query.id },
            data: { status: "failed" },
          })
        } catch {
          // Ignore secondary failure
        }
      }
    },
  })

  // Return response with query ID header for client tracking
  const response = result.toTextStreamResponse()
  if (query) {
    response.headers.set("X-Query-Id", query.id)
    if (conversationId) {
      response.headers.set("X-Conversation-Id", conversationId)
    } else {
      // Generate new conversation ID if not provided
      response.headers.set("X-Conversation-Id", query.id)
    }
  }

  return response
}
