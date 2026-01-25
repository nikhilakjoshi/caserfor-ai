import { createAnthropic } from "@ai-sdk/anthropic"

const globalForAI = globalThis as unknown as {
  anthropic: ReturnType<typeof createAnthropic> | undefined
}

function createAnthropicProvider() {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set")
  }

  return createAnthropic({
    apiKey,
  })
}

export const anthropic = globalForAI.anthropic ?? createAnthropicProvider()

if (process.env.NODE_ENV !== "production") globalForAI.anthropic = anthropic

// Default model for general use
export const defaultModel = anthropic("claude-sonnet-4-20250514")

// Model for complex analysis tasks
export const analysisModel = anthropic("claude-sonnet-4-20250514")

export default anthropic
