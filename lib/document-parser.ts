// @ts-expect-error -- pdf-parse v1 lacks types for direct import, bypasses test file loading
import pdf from "pdf-parse/lib/pdf-parse.js"
import mammoth from "mammoth"

export async function extractText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  const type = fileType.toLowerCase()

  if (type === "pdf" || type === "application/pdf") {
    const result = await pdf(buffer)
    return result.text
  }

  if (
    type === "docx" ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (
    type === "doc" ||
    type === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (
    type === "txt" ||
    type === "text/plain" ||
    type === "md" ||
    type === "text/markdown"
  ) {
    return buffer.toString("utf-8")
  }

  throw new Error(`Unsupported file type: ${fileType}`)
}
