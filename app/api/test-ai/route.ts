import { streamText } from "ai"
import { defaultModel } from "@/lib/ai"

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const result = streamText({
    model: defaultModel,
    prompt: prompt || "Say hello in one sentence.",
  })

  return result.toTextStreamResponse()
}
