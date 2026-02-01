"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  ArrowUpDown,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  AlertCircle,
} from "lucide-react"
import { DOCUMENT_CATEGORIES, getCategoryLabel } from "@/lib/document-categories"
import { DocumentViewer } from "@/components/vault/document-viewer"

interface Document {
  id: string
  name: string
  documentType: string | null
  fileType: string
  sizeBytes: number
  embeddingStatus: "pending" | "processing" | "completed" | "failed"
  createdAt: string
  updatedAt: string
}

type SortField = "name" | "documentType" | "updatedAt" | "fileType" | "sizeBytes"
type SortDirection = "asc" | "desc"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface ClientVaultDocumentsProps {
  vaultId: string
  readOnly?: boolean
}

export function ClientVaultDocuments({ vaultId, readOnly = false }: ClientVaultDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("updatedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [previewDoc, setPreviewDoc] = useState<{ url: string; fileName: string; fileType: string } | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/vaults/${vaultId}/documents`)
      if (!res.ok) throw new Error("Failed to load documents")
      setDocuments(await res.json())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents")
    } finally {
      setLoading(false)
    }
  }, [vaultId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Poll for processing docs
  const hasProcessing = documents.some(
    (d) => d.embeddingStatus === "pending" || d.embeddingStatus === "processing"
  )

  useEffect(() => {
    if (hasProcessing) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/vaults/${vaultId}/documents`)
          if (res.ok) setDocuments(await res.json())
        } catch { /* ignore */ }
      }, 4000)
    } else if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [hasProcessing, vaultId])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleCategoryChange = async (docId: string, category: string) => {
    if (readOnly) return
    try {
      const res = await fetch(`/api/vaults/${vaultId}/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: category }),
      })
      if (!res.ok) throw new Error("Failed to update")
      const updated = await res.json()
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, documentType: updated.documentType, updatedAt: updated.updatedAt } : d))
      )
    } catch (err) {
      console.error("Failed to update category:", err)
    }
  }

  const handlePreview = async (doc: Document) => {
    if (isLoadingPreview) return
    setIsLoadingPreview(true)
    try {
      const res = await fetch(`/api/vaults/${vaultId}/documents/${doc.id}/presign`)
      if (!res.ok) throw new Error("Failed to get URL")
      const { url } = await res.json()
      setPreviewDoc({ url, fileName: doc.name, fileType: doc.fileType })
    } catch (err) {
      console.error("Preview failed:", err)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleRetry = async (docId: string) => {
    try {
      const res = await fetch(`/api/vaults/${vaultId}/documents/${docId}/retry`, { method: "POST" })
      if (!res.ok) throw new Error("Retry failed")
      const updated = await res.json()
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, embeddingStatus: updated.embeddingStatus } : d))
      )
    } catch (err) {
      console.error("Retry failed:", err)
    }
  }

  const filtered = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.documentType?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    switch (sortField) {
      case "name": cmp = a.name.localeCompare(b.name); break
      case "documentType": cmp = (a.documentType || "").localeCompare(b.documentType || ""); break
      case "updatedAt": cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break
      case "fileType": cmp = a.fileType.localeCompare(b.fileType); break
      case "sizeBytes": cmp = a.sizeBytes - b.sizeBytes; break
    }
    return sortDirection === "asc" ? cmp : -cmp
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchDocuments}>
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">
                  <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort("name")}>
                    Name <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort("documentType")}>
                    Category <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort("updatedAt")}>
                    Updated <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort("fileType")}>
                    Type <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort("sizeBytes")}>
                    Size <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="text-muted-foreground">
                      {searchQuery ? `No files match "${searchQuery}"` : "No files in this vault"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((doc) => (
                  <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handlePreview(doc)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{doc.name}</span>
                        {doc.embeddingStatus === "pending" && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" /> Pending
                          </Badge>
                        )}
                        {doc.embeddingStatus === "processing" && (
                          <Badge variant="secondary" className="text-xs text-blue-600">
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processing
                          </Badge>
                        )}
                        {doc.embeddingStatus === "completed" && (
                          <Badge variant="secondary" className="text-xs text-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Embedded
                          </Badge>
                        )}
                        {doc.embeddingStatus === "failed" && (
                          <span className="inline-flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs text-red-600">
                              <XCircle className="mr-1 h-3 w-3" /> Failed
                            </Badge>
                            {!readOnly && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1"
                                onClick={(e) => { e.stopPropagation(); handleRetry(doc.id) }}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {readOnly ? (
                        <Badge variant="secondary">
                          {doc.documentType ? getCategoryLabel(doc.documentType) : "-"}
                        </Badge>
                      ) : (
                        <Select
                          value={doc.documentType || ""}
                          onValueChange={(value) => handleCategoryChange(doc.id, value)}
                        >
                          <SelectTrigger className="h-7 w-[160px] text-xs">
                            <SelectValue placeholder="Set category">
                              {doc.documentType ? getCategoryLabel(doc.documentType) : "Set category"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.slug} value={cat.slug}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(doc.updatedAt)}</TableCell>
                    <TableCell>
                      <span className="uppercase text-xs text-muted-foreground">{doc.fileType}</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatBytes(doc.sizeBytes)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-xs text-muted-foreground">
          {documents.length} document{documents.length !== 1 ? "s" : ""}
        </div>
      </div>

      {previewDoc && (
        <DocumentViewer
          url={previewDoc.url}
          fileName={previewDoc.fileName}
          fileType={previewDoc.fileType}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </>
  )
}
