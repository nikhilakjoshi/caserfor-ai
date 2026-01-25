"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Database,
  FolderOpen,
  MessageSquare,
  Upload,
  FolderPlus,
  Share2,
  FileText,
  ArrowUpDown,
  MoreVertical,
  ChevronDown,
  Search,
  TableIcon,
  ArrowLeft,
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

// Mock vault data - replace with API
const mockVault: Vault = {
  id: "1",
  name: "M&A Deal Documents",
  description: "Due diligence materials for Project Apollo",
  type: "knowledge_base",
  isShared: true,
  fileCount: 234,
  createdAt: "2026-01-15",
  updatedAt: "2026-01-24",
}

// Mock documents - replace with API
const mockDocuments: Document[] = [
  {
    id: "d1",
    name: "Purchase Agreement - Final.pdf",
    documentType: "Agreement",
    fileType: "pdf",
    sizeBytes: 2456789,
    embeddingStatus: "completed",
    createdAt: "2026-01-20T10:30:00Z",
    updatedAt: "2026-01-24T14:20:00Z",
  },
  {
    id: "d2",
    name: "Due Diligence Checklist.docx",
    documentType: "Checklist",
    fileType: "docx",
    sizeBytes: 145230,
    embeddingStatus: "completed",
    createdAt: "2026-01-18T09:00:00Z",
    updatedAt: "2026-01-22T11:45:00Z",
  },
  {
    id: "d3",
    name: "Financial Statements Q4 2025.xlsx",
    documentType: "Financial",
    fileType: "xlsx",
    sizeBytes: 3890125,
    embeddingStatus: "processing",
    createdAt: "2026-01-22T16:00:00Z",
    updatedAt: "2026-01-25T08:30:00Z",
  },
  {
    id: "d4",
    name: "Corporate Structure Chart.pdf",
    documentType: "Corporate",
    fileType: "pdf",
    sizeBytes: 567890,
    embeddingStatus: "completed",
    createdAt: "2026-01-19T14:15:00Z",
    updatedAt: "2026-01-21T10:00:00Z",
  },
  {
    id: "d5",
    name: "IP Portfolio Summary.pdf",
    documentType: null,
    fileType: "pdf",
    sizeBytes: 1234567,
    embeddingStatus: "pending",
    createdAt: "2026-01-25T09:00:00Z",
    updatedAt: "2026-01-25T09:00:00Z",
  },
]

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
  const [searchQuery, setSearchQuery] = useState("")
  const [quickQuery, setQuickQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("updatedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  useEffect(() => {
    // TODO: Replace with API call to GET /api/vaults/[id]
    const loadVault = async () => {
      setIsLoading(true)
      // Simulate API delay
      await new Promise((r) => setTimeout(r, 200))
      setVault({ ...mockVault, id: vaultId })
      setDocuments(mockDocuments)
      setIsLoading(false)
    }
    loadVault()
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

  if (isLoading || !vault) {
    return (
      <>
        <PageHeader title="Loading..." />
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Link href={`/assistant?vault=${vaultId}`}>
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              Start a query
            </Button>
          </Link>
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
    </>
  )
}
