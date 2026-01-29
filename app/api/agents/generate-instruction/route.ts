import { streamText } from "ai"
import { defaultModel } from "@/lib/ai"

export async function POST(request: Request) {
  try {
    const { mode, text }: { mode: "generate" | "improve"; text: string } =
      await request.json()

    if (!mode || !["generate", "improve"].includes(mode)) {
      return new Response(
        JSON.stringify({ error: "mode must be 'generate' or 'improve'" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const systemPrompt =
      mode === "generate"
        ? `You are an expert at writing system instructions for AI agents. The user will give you a rough idea of what an agent should do. Produce a clear, structured system instruction that defines the agent's role, behavior, constraints, and output format. Be specific and actionable. Output ONLY the system instruction text, no preamble or explanation.`
        : `You are an expert at refining AI agent system instructions. The user will give you an existing system instruction. Improve it by making it clearer, more specific, better structured, and more effective. Fix any ambiguities. Add constraints or formatting guidance if missing. Output ONLY the improved system instruction text, no preamble or explanation.`

    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      prompt: text.trim(),
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Generate instruction error:", error)
    return new Response(
      JSON.stringify({ error: "Failed to generate instruction" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
