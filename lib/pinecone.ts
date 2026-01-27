import { Pinecone } from "@pinecone-database/pinecone"

const globalForPinecone = globalThis as unknown as {
  pinecone: Pinecone | undefined
}

function createPineconeClient() {
  const apiKey = process.env.PINECONE_API_KEY

  if (!apiKey) {
    throw new Error("PINECONE_API_KEY environment variable is not set")
  }

  return new Pinecone({ apiKey })
}

export const pinecone = globalForPinecone.pinecone ?? createPineconeClient()

if (process.env.NODE_ENV !== "production") globalForPinecone.pinecone = pinecone

function getIndex() {
  const indexName = process.env.PINECONE_INDEX
  if (!indexName) {
    throw new Error("PINECONE_INDEX environment variable is not set")
  }
  return pinecone.index(indexName)
}

export interface VectorMetadata {
  documentId: string
  chunkIndex: number
  text: string
  documentName: string
  documentType: string
  [key: string]: string | number
}

export async function upsertVectors(
  namespace: string,
  vectors: { id: string; values: number[]; metadata: VectorMetadata }[]
) {
  const index = getIndex().namespace(namespace)
  const batchSize = 100
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize)
    await index.upsert(batch)
  }
}

export async function queryVectors(
  namespace: string,
  vector: number[],
  topK: number = 10,
  filter?: Record<string, unknown>
) {
  const index = getIndex().namespace(namespace)
  return index.query({
    vector,
    topK,
    includeMetadata: true,
    ...(filter && { filter }),
  })
}

export async function deleteVectors(namespace: string, ids: string[]) {
  const index = getIndex().namespace(namespace)
  await index.deleteMany(ids)
}

export async function deleteNamespace(namespace: string) {
  const index = getIndex().namespace(namespace)
  await index.deleteAll()
}

export function vaultNamespace(vaultId: string) {
  return `vault-${vaultId}`
}

export default pinecone
