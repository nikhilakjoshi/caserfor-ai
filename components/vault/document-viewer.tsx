"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Lazy-load react-pdf components (requires DOM APIs like DOMMatrix)
const ReactPdfDocument = dynamic(
  () => import("react-pdf").then((mod) => {
    mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString()
    return { default: mod.Document }
  }),
  { ssr: false }
)
const ReactPdfPage = dynamic(
  () => import("react-pdf").then((mod) => ({ default: mod.Page })),
  { ssr: false }
)

interface DocumentViewerProps {
  url: string
  fileName: string
  fileType: string // "pdf", "docx", "txt", etc.
  textContent?: string // Pre-extracted text for non-PDF files
  targetPage?: number
  onClose: () => void
}

export function DocumentViewer({
  url,
  fileName,
  fileType,
  textContent,
  targetPage,
  onClose,
}: DocumentViewerProps) {
  useEffect(() => {
    import("react-pdf/dist/Page/AnnotationLayer.css")
    import("react-pdf/dist/Page/TextLayer.css")
  }, [])

  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(targetPage || 1)
  const [scale, setScale] = useState(1.2)
  const [pdfError, setPdfError] = useState(false)

  const onDocumentLoadSuccess = useCallback(({ numPages: total }: { numPages: number }) => {
    setNumPages(total)
    if (targetPage && targetPage <= total) {
      setCurrentPage(targetPage)
    }
  }, [targetPage])

  const goToPage = (page: number) => {
    if (numPages && page >= 1 && page <= numPages) {
      setCurrentPage(page)
    }
  }

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3))
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5))

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.target = "_blank"
    a.click()
  }

  const isPdf = fileType.toLowerCase() === "pdf"

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-background border w-[85vw] h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <span className="text-sm font-medium truncate max-w-[50%]">{fileName}</span>
          <div className="flex items-center gap-1">
            {isPdf && numPages && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="w-px h-5 bg-border mx-1" />
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-muted/10">
          {isPdf && !pdfError ? (
            <ReactPdfDocument
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={() => setPdfError(true)}
              loading={
                <div className="flex items-center gap-2 text-muted-foreground py-12">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading PDF...
                </div>
              }
            >
              <ReactPdfPage pageNumber={currentPage} scale={scale} />
            </ReactPdfDocument>
          ) : (
            <div className="max-w-3xl w-full bg-background border p-8">
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {textContent || (pdfError ? "Failed to load PDF preview." : "Preview not available for this file type.")}
              </pre>
            </div>
          )}
        </div>

        {/* Footer - page nav for PDFs */}
        {isPdf && numPages && numPages > 1 && (
          <div className="flex items-center justify-center gap-3 px-4 py-2 border-t bg-muted/30">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {numPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
