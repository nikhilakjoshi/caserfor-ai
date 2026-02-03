import {
  ToolLoopAgent,
  createAgentUIStreamResponse,
  type UIMessage,
} from "ai"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"
import { createRecLetterChatAgent } from "@/lib/drafting-agents/rec-letter-chat-agent"

type Params = { params: Promise<{ clientId: string; id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { clientId, id } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const body = await request.json()
    const { messages, currentContent } = body as {
      messages?: UIMessage[]
      currentContent?: string
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "messages required" },
        { status: 400 },
      )
    }

    // Validate recommender belongs to client
    const rec = await prisma.recommender.findFirst({
      where: { id, clientId },
    })
    if (!rec) {
      return NextResponse.json(
        { error: "Recommender not found" },
        { status: 404 },
      )
    }

    // Truncate to last 20 messages server-side
    const truncated = messages.length > 20 ? messages.slice(-20) : messages

    const { model, instructions, tools } = createRecLetterChatAgent(
      clientId,
      id,
      currentContent ?? "",
    )

    const agent = new ToolLoopAgent({
      model,
      instructions,
      tools,
    })

    return createAgentUIStreamResponse({
      agent,
      uiMessages: truncated,
    })
  } catch (error) {
    console.error("Error in draft-chat:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
