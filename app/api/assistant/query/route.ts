import { streamText } from "ai"
import { defaultModel, analysisModel } from "@/lib/ai"

export async function POST(req: Request) {
  const { inputText, outputType, sources, deepAnalysis } = await req.json()

  if (!inputText?.trim()) {
    return new Response(JSON.stringify({ error: "inputText is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const model = deepAnalysis ? analysisModel : defaultModel

  // Build system prompt based on output type
  let systemPrompt = "You are a legal document assistant. "

  if (outputType === "draft") {
    systemPrompt += "Generate well-structured, professional document drafts. Use clear headings, proper formatting, and professional legal language."
  } else if (outputType === "review_table") {
    systemPrompt += "Extract and organize information into a structured table format. Use markdown tables with clear column headers."
  } else {
    systemPrompt += "Provide helpful, accurate responses to legal research questions."
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
  })

  return result.toTextStreamResponse()
}
