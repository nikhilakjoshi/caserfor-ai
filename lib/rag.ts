import { embedQuery } from "./embeddings"
import { queryVectors, vaultNamespace, type VectorMetadata } from "./pinecone"

export interface RetrievedChunk {
  documentId: string
  documentName: string
  documentType: string
  chunkIndex: number
  text: string
  score: number
}

export async function queryRelevantChunks(
  query: string,
  documentIds: string[],
  options?: { topK?: number; vaultId?: string }
): Promise<RetrievedChunk[]> {
  const topK = options?.topK ?? 10

  if (!options?.vaultId || documentIds.length === 0) {
    return []
  }

  const queryVector = await embedQuery(query)

  const result = await queryVectors(
    vaultNamespace(options.vaultId),
    queryVector,
    topK,
    { documentId: { $in: documentIds } }
  )

  if (!result.matches) return []

  return result.matches
    .filter((m) => m.metadata)
    .map((m) => {
      const meta = m.metadata as unknown as VectorMetadata
      return {
        documentId: meta.documentId,
        documentName: meta.documentName,
        documentType: meta.documentType,
        chunkIndex: meta.chunkIndex,
        text: meta.text,
        score: m.score ?? 0,
      }
    })
}
