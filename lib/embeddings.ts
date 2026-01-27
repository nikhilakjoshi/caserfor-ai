import { embedMany, embed } from "ai"
import { embeddingModel } from "./ai"

export async function embedChunks(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  })
  return embeddings
}

export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  })
  return embedding
}
