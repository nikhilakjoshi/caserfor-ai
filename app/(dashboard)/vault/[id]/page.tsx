"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Database,
  FolderOpen,
  MessageSquare,
  Upload,
  FolderPlus,
  Share2,
  FileText,
  ArrowUpDown,
  MoreVertical,
  Search,
  TableIcon,
  ArrowLeft,
  Sparkles,
  X,
  File,
} from "lucide-react"
import Link from "next/link"

type VaultType = "knowledge_base" | "sandbox"
type EmbeddingStatus = "pending" | "processing" | "completed" | "failed"

interface Document {
  id: string
  name: string
  documentType: string | null
  fileType: string
  sizeBytes: number
  embeddingStatus: EmbeddingStatus
  createdAt: string
  updatedAt: string
}

interface Vault {
  id: string
  name: string
  description: string | null
  type: VaultType
  isShared: boolean
  fileCount: number
  createdAt: string
  updatedAt: string
}

type SortField = "name" | "documentType" | "updatedAt" | "fileType" | "sizeBytes"
type SortDirection = "asc" | "desc"

const documentTypeColors: Record<string, string> = {
  Agreement: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Checklist: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Financial: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Corporate: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function VaultDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vaultId = params.id as string

  const [vault, setVault] = useState<Vault | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [quickQuery, setQuickQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("updatedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [showQueryModal, setShowQueryModal] = useState(false)
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [queryModalSortField, setQueryModalSortField] = useState<SortField>("name")
  const [queryModalSortDirection, setQueryModalSortDirection] = useState<SortDirection>("asc")

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [vaultRes, docsRes] = await Promise.all([
        fetch(`/api/vaults/${vaultId}`),
        fetch(`/api/vaults/${vaultId}/documents`),
      ])
      if (!vaultRes.ok) {
        if (vaultRes.status === 404) throw new Error("Vault not found")
        throw new Error("Failed to load vault")
      }
      if (!docsRes.ok) throw new Error("Failed to load documents")
      const vaultData = await vaultRes.json()
      const docsData = await docsRes.json()
      setVault(vaultData)
      setDocuments(docsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vault")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultId])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleQuickQuery = () => {
    if (!quickQuery.trim()) return
    // Navigate to assistant with vault pre-selected
    router.push(`/assistant?vault=${vaultId}&query=${encodeURIComponent(quickQuery)}`)
  }

  const handleOpenQueryModal = () => {
    setSelectedFileIds([])
    setShowQueryModal(true)
  }

  const handleQueryModalSort = (field: SortField) => {
    if (queryModalSortField === field) {
      setQueryModalSortDirection(queryModalSortDirection === "asc" ? "desc" : "asc")
    } else {
      setQueryModalSortField(field)
      setQueryModalSortDirection("asc")
    }
  }

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    )
  }

  const toggleSelectAllFiles = () => {
    if (selectedFileIds.length === documents.length) {
      setSelectedFileIds([])
    } else {
      setSelectedFileIds(documents.map((d) => d.id))
    }
  }

  const handleStartQuery = () => {
    if (selectedFileIds.length === 0) return
    // Navigate to assistant with vault and selected files
    const fileIdsParam = encodeURIComponent(selectedFileIds.join(","))
    router.push(`/assistant?vault=${vaultId}&vaultName=${encodeURIComponent(vault?.name || "")}&files=${fileIdsParam}`)
    setShowQueryModal(false)
  }

  // Sort documents for query modal
  const queryModalSortedDocs = [...documents].sort((a, b) => {
    let comparison = 0
    switch (queryModalSortField) {
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "documentType":
        comparison = (a.documentType || "").localeCompare(b.documentType || "")
        break
      case "updatedAt":
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        break
      case "fileType":
        comparison = a.fileType.localeCompare(b.fileType)
        break
      case "sizeBytes":
        comparison = a.sizeBytes - b.sizeBytes
        break
    }
    return queryModalSortDirection === "asc" ? comparison : -comparison
  })

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.documentType?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "documentType":
        comparison = (a.documentType || "").localeCompare(b.documentType || "")
        break
      case "updatedAt":
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        break
      case "fileType":
        comparison = a.fileType.localeCompare(b.fileType)
        break
      case "sizeBytes":
        comparison = a.sizeBytes - b.sizeBytes
        break
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  if (isLoading) {
    return (
      <>
        <PageHeader title="Loading..." />
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </>
    )
  }

  if (error || !vault) {
    return (
      <>
        <PageHeader title="Error" />
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">{error || "Vault not found"}</p>
          <div className="flex gap-2">
            <Link href="/vault">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Vaults
              </Button>
            </Link>
            <Button onClick={fetchData}>Retry</Button>
          </div>
        </div>
      </>
    )
  }

  const VaultIcon = vault.type === "knowledge_base" ? Database : FolderOpen

  return (
    <>
      <PageHeader title={vault.name} />

      <div className="flex flex-col gap-6">
        {/* Back link and header */}
        <div className="flex items-center gap-4">
          <Link href="/vault">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vaults
            </Button>
          </Link>
        </div>

        {/* Vault info bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-muted p-2">
                <VaultIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{vault.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{vault.fileCount} files</span>
                  <span className="capitalize">{vault.type.replace("_", " ")}</span>
                  {vault.isShared && (
                    <Badge variant="secondary">Shared</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick query box */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Ask anything..."
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickQuery()}
                className="w-64 pr-10"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={handleQuickQuery}
                disabled={!quickQuery.trim()}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Query Banner - only show when vault has files */}
        {documents.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-muted/50 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium">Start querying your knowledge base</span>
            </div>
            <Button onClick={handleOpenQueryModal}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Start a Query
            </Button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenQueryModal}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Start a query
          </Button>
          <Button variant="outline">
            <TableIcon className="mr-2 h-4 w-4" />
            Create review table
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload files
          </Button>
          <Button variant="outline">
            <FolderPlus className="mr-2 h-4 w-4" />
            Create folder
          </Button>
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Files table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort("name")}
                  >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort("documentType")}
                  >
                    Document type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort("updatedAt")}
                  >
                    Updated
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort("fileType")}
                  >
                    File type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort("sizeBytes")}
                  >
                    Size
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {searchQuery ? (
                      <div className="text-muted-foreground">
                        No files match &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileText className="h-8 w-8" />
                        <span>No files yet</span>
                        <Button variant="outline" size="sm">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload files
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                sortedDocuments.map((doc) => (
                  <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{doc.name}</span>
                        {doc.embeddingStatus === "processing" && (
                          <Badge variant="secondary" className="text-xs">
                            Processing
                          </Badge>
                        )}
                        {doc.embeddingStatus === "pending" && (
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.documentType ? (
                        <Badge
                          variant="secondary"
                          className={documentTypeColors[doc.documentType] || ""}
                        >
                          {doc.documentType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(doc.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <span className="uppercase text-xs text-muted-foreground">
                        {doc.fileType}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatBytes(doc.sizeBytes)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Download</DropdownMenuItem>
                          <DropdownMenuItem>Rename</DropdownMenuItem>
                          <DropdownMenuItem>Set document type</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* File Selection Modal for Start a Query */}
      <Dialog open={showQueryModal} onOpenChange={(open) => {
        setShowQueryModal(open)
        if (!open) setSelectedFileIds([])
      }}>
        <DialogContent
          className="w-[50vw] max-w-[50vw] h-[50vh] max-h-[50vh] bg-gray-50 dark:bg-muted/50 border border-neutral-200 dark:border-neutral-700 p-0 flex flex-col overflow-hidden"
          showCloseButton={false}
        >
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-background">
            <div className="flex items-center justify-between">
              <DialogTitle>Select files to query</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowQueryModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Content - File Table */}
          <div className="flex-1 overflow-y-auto p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedFileIds.length === documents.length && documents.length > 0}
                      onCheckedChange={toggleSelectAllFiles}
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleQueryModalSort("name")}
                    >
                      File Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleQueryModalSort("documentType")}
                    >
                      Type
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleQueryModalSort("sizeBytes")}
                    >
                      Size
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queryModalSortedDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="text-muted-foreground">No files in this vault</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  queryModalSortedDocs.map((doc) => {
                    const isSelected = selectedFileIds.includes(doc.id)
                    return (
                      <TableRow
                        key={doc.id}
                        className="cursor-pointer"
                        onClick={() => toggleFileSelection(doc.id)}
                        data-state={isSelected ? "selected" : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleFileSelection(doc.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{doc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.documentType ? (
                            <Badge
                              variant="secondary"
                              className={documentTypeColors[doc.documentType] || ""}
                            >
                              {doc.documentType}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatBytes(doc.sizeBytes)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-background flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedFileIds.length} file{selectedFileIds.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowQueryModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleStartQuery} disabled={selectedFileIds.length === 0}>
                Go
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
