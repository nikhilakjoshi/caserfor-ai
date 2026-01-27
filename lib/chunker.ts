export interface Chunk {
  text: string
  chunkIndex: number
}

// ~4 chars per token approximation
const CHARS_PER_TOKEN = 4
const DEFAULT_CHUNK_TOKENS = 1000
const DEFAULT_OVERLAP_TOKENS = 200

export function chunkText(
  text: string,
  chunkTokens: number = DEFAULT_CHUNK_TOKENS,
  overlapTokens: number = DEFAULT_OVERLAP_TOKENS
): Chunk[] {
  const chunkSize = chunkTokens * CHARS_PER_TOKEN
  const overlapSize = overlapTokens * CHARS_PER_TOKEN

  if (!text || text.trim().length === 0) {
    return []
  }

  if (text.length <= chunkSize) {
    return [{ text: text.trim(), chunkIndex: 0 }]
  }

  const chunks: Chunk[] = []
  let start = 0
  let chunkIndex = 0

  while (start < text.length) {
    let end = start + chunkSize

    // Try to break at sentence boundary
    if (end < text.length) {
      const slice = text.slice(start, end)
      const lastPeriod = slice.lastIndexOf(". ")
      const lastNewline = slice.lastIndexOf("\n")
      const breakPoint = Math.max(lastPeriod, lastNewline)
      if (breakPoint > chunkSize * 0.5) {
        end = start + breakPoint + 1
      }
    }

    const chunk = text.slice(start, end).trim()
    if (chunk.length > 0) {
      chunks.push({ text: chunk, chunkIndex })
      chunkIndex++
    }

    start = end - overlapSize
    if (start >= text.length) break
    // Prevent infinite loop if overlap >= chunk size
    if (end >= text.length) break
  }

  return chunks
}
