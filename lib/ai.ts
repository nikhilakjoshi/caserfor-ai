import { createGoogleGenerativeAI } from "@ai-sdk/google"

const globalForAI = globalThis as unknown as {
  google: ReturnType<typeof createGoogleGenerativeAI> | undefined
}

function createGoogleProvider() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set")
  }

  return createGoogleGenerativeAI({
    apiKey,
  })
}

export const google = globalForAI.google ?? createGoogleProvider()

if (process.env.NODE_ENV !== "production") globalForAI.google = google

// Default model for general use
export const defaultModel = google("gemini-2.5-flash")

// Model for complex analysis tasks
export const analysisModel = google("gemini-2.5-pro")

// Embedding model (768 dimensions)
export const embeddingModel = google.textEmbeddingModel("text-embedding-004")

export default google
