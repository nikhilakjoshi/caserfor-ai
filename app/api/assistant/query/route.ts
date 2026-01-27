import { streamText } from "ai"
import { defaultModel, analysisModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import { queryRelevantChunks, type RetrievedChunk } from "@/lib/rag"
import type { AssistantQuery, QueryOutputType, SourceType } from "@prisma/client"

// TODO: Replace with actual auth when implemented
const MOCK_USER_ID = "mock-user-id"

interface AttachedFileInput {
  id: string
  name: string
  size: number
  source: "upload" | "vault"
  vaultId?: string
}

export async function POST(req: Request) {
  const { inputText, outputType, sources, deepAnalysis, conversationId, attachedFiles } =
    await req.json()

  if (!inputText?.trim()) {
    return new Response(JSON.stringify({ error: "inputText is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const files: AttachedFileInput[] = attachedFiles || []

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

    // Create source references for vaults
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

    // Create source references for attached files
    if (files.length > 0) {
      await prisma.sourceReference.createMany({
        data: files.map((f: AttachedFileInput) => ({
          queryId,
          sourceType: "document" as SourceType,
          sourceId: f.id,
          sourceName: f.name,
        })),
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

  // RAG: retrieve relevant chunks from vault files
  let ragChunks: RetrievedChunk[] = []
  const vaultFiles = files.filter((f: AttachedFileInput) => f.source === "vault")
  if (vaultFiles.length > 0 && vaultFiles[0].vaultId) {
    try {
      ragChunks = await queryRelevantChunks(
        inputText,
        vaultFiles.map((f: AttachedFileInput) => f.id),
        { topK: 10, vaultId: vaultFiles[0].vaultId }
      )
    } catch (error) {
      console.error("RAG retrieval failed:", error)
    }
  }

  // Build system prompt based on output type
  let systemPrompt = `You are a legal document assistant.

IMPORTANT: You MUST prefix your response with a mode tag on the first line.
- Use [MODE:document] when generating document drafts, memos, letters, contracts, or any substantive written content that the user would edit.
- Use [MODE:chat] when answering questions, providing explanations, giving advice, or having a conversation.

The mode tag should appear alone on the first line, followed by a blank line, then your actual response.

Example for document mode:
[MODE:document]

Dear Client,

This letter is to inform you...

Example for chat mode:
[MODE:chat]

Based on my analysis, the key considerations are...

`

  if (outputType === "draft") {
    systemPrompt +=
      "The user has selected 'draft document' output. Generate well-structured, professional document drafts. Use clear headings, proper formatting, and professional legal language. You should respond with [MODE:document]."
  } else if (outputType === "review_table") {
    systemPrompt +=
      "Extract and organize information into a structured table format. Use markdown tables with clear column headers. You may use either [MODE:document] for complex tables or [MODE:chat] for simple responses."
  } else {
    systemPrompt +=
      "Provide helpful, accurate responses to legal research questions. Determine the appropriate mode based on whether you are generating a document or answering a question."
  }

  // Add citation instructions when RAG context present
  if (ragChunks.length > 0) {
    systemPrompt += `\n\nYou have been provided with relevant excerpts from the user's documents. Use these to ground your response.
When citing information from a document, use the format [docName, chunk N] where docName is the document name and N is the chunk index.
Each citation must reference a specific document. Only cite information that appears in the provided excerpts.`
  }

  // Build user prompt with RAG context
  let userPrompt = inputText
  const contextParts: string[] = []

  if (ragChunks.length > 0) {
    const chunksText = ragChunks
      .map((c) => `--- ${c.documentName} (chunk ${c.chunkIndex}) ---\n${c.text}`)
      .join("\n\n")
    contextParts.push(`Document excerpts:\n${chunksText}`)
  }

  if (sources?.length > 0) {
    const sourceNames = sources.map((s: { name: string }) => s.name).join(", ")
    contextParts.push(`Vault sources: ${sourceNames}`)
  }

  if (files.length > 0) {
    const fileNames = files.map((f: AttachedFileInput) => f.name).join(", ")
    contextParts.push(`Attached files: ${fileNames}`)
  }

  if (contextParts.length > 0) {
    userPrompt = `${contextParts.join("\n\n")}\n\nQuery: ${inputText}`
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

        // Store RAG source references
        if (ragChunks.length > 0) {
          await prisma.sourceReference.createMany({
            data: ragChunks.map((c) => ({
              queryId: query!.id,
              sourceType: "document" as SourceType,
              sourceId: c.documentId,
              sourceName: c.documentName,
              metadata: { chunkIndex: c.chunkIndex, score: c.score, textSnippet: c.text.substring(0, 200) },
            })),
          })
        }

        // Create history entry
        const title =
          inputText.length > 50 ? inputText.substring(0, 50) + "..." : inputText

        // Build sources summary from vaults and attached files
        const summaryParts: string[] = []
        if (sources?.length > 0) {
          summaryParts.push(sources.map((s: { name: string }) => s.name).join(", "))
        }
        if (files.length > 0) {
          summaryParts.push(`${files.length} file${files.length !== 1 ? "s" : ""} attached`)
        }
        const sourcesSummary = summaryParts.length > 0 ? summaryParts.join("; ") : null

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
