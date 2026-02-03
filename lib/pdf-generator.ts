import PDFDocument from "pdfkit"

/**
 * Convert HTML string (from TipTap editor) to a PDF buffer.
 * Handles basic formatting: headings, paragraphs, bold, italic, bullet lists.
 */
export async function htmlToPdfBuffer(html: string, _title?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
    })

    const chunks: Uint8Array[] = []
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    // Strip HTML and render as formatted text
    const lines = parseHtmlToLines(html)

    for (const line of lines) {
      switch (line.type) {
        case "h1":
          doc.fontSize(18).font("Helvetica-Bold").text(line.text, { paragraphGap: 8 })
          break
        case "h2":
          doc.fontSize(15).font("Helvetica-Bold").text(line.text, { paragraphGap: 6 })
          break
        case "h3":
          doc.fontSize(12).font("Helvetica-Bold").text(line.text, { paragraphGap: 4 })
          break
        case "bullet":
          doc.fontSize(11).font("Helvetica").text(`  \u2022  ${line.text}`, { paragraphGap: 2 })
          break
        case "paragraph":
          doc.fontSize(11).font("Helvetica").text(line.text, { paragraphGap: 4 })
          break
        case "blank":
          doc.moveDown(0.5)
          break
      }
    }

    doc.end()
  })
}

interface Line {
  type: "h1" | "h2" | "h3" | "paragraph" | "bullet" | "blank"
  text: string
}

function parseHtmlToLines(html: string): Line[] {
  const lines: Line[] = []

  // Replace <br> with newlines
  const cleaned = html.replace(/<br\s*\/?>/gi, "\n")

  // Process block elements
  const blockRegex = /<(h[1-3]|p|li|ul|ol|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi
  let match

  while ((match = blockRegex.exec(cleaned)) !== null) {
    const tag = match[1].toLowerCase()
    const content = stripTags(match[2]).trim()

    if (!content) {
      lines.push({ type: "blank", text: "" })
      continue
    }

    switch (tag) {
      case "h1":
        lines.push({ type: "h1", text: content })
        break
      case "h2":
        lines.push({ type: "h2", text: content })
        break
      case "h3":
        lines.push({ type: "h3", text: content })
        break
      case "li":
        lines.push({ type: "bullet", text: content })
        break
      case "blockquote":
        lines.push({ type: "paragraph", text: content })
        break
      default:
        lines.push({ type: "paragraph", text: content })
    }
  }

  // If no block elements found, treat as plain text
  if (lines.length === 0) {
    const plainText = stripTags(cleaned).trim()
    if (plainText) {
      for (const para of plainText.split(/\n\n+/)) {
        const trimmed = para.trim()
        if (trimmed) {
          lines.push({ type: "paragraph", text: trimmed })
        }
      }
    }
  }

  return lines
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
}
