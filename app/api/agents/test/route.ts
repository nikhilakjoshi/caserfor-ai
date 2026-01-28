import { NextRequest } from "next/server"
import { streamText } from "ai"
import { defaultModel } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instruction, messages } = body

    if (!instruction || typeof instruction !== "string") {
      return new Response(JSON.stringify({ error: "Instruction is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const result = streamText({
      model: defaultModel,
      system: instruction,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Agent test error:", error)
    return new Response(JSON.stringify({ error: "Failed to run agent test" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
