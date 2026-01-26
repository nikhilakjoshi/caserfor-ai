import { streamText } from "ai"
import { defaultModel } from "@/lib/ai"

export async function POST(req: Request) {
  const { inputText } = await req.json()

  if (!inputText?.trim()) {
    return new Response(JSON.stringify({ error: "inputText is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const systemPrompt = `You are a prompt refinement assistant specialized in legal document analysis. Your task is to take a user's rough prompt or query and transform it into a detailed, optimized version that will produce better results from an AI legal assistant.

Rules:
- Output ONLY the improved prompt, no explanations or meta-commentary
- Maintain the original intent but add specificity and structure
- Include relevant legal terminology where appropriate
- Add clear instructions about format, scope, and deliverables
- Keep it concise but comprehensive
- Do not add information the user didn't imply`

  const userPrompt = `Improve this prompt for a legal AI assistant:\n\n${inputText}`

  const result = streamText({
    model: defaultModel,
    system: systemPrompt,
    prompt: userPrompt,
  })

  return result.toTextStreamResponse()
}
