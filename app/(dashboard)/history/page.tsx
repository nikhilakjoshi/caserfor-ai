"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  ChevronDown,
  FileText,
  MessageSquare,
  Table as TableIcon,
  BarChart3,
  Clock,
  Database,
  Globe,
  BookOpen,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

type QueryOutputType = "chat" | "draft" | "review_table" | "analysis"
type SourceType = "vault" | "document" | "agent" | "external_database" | "system_knowledge"

interface SourceReference {
  id: string
  sourceType: SourceType
  sourceId: string
  sourceName: string
}

interface HistoryEntry {
  id: string
  queryId: string
  title: string
  type: QueryOutputType
  sourcesSummary: string | null
  createdAt: string
  inputText: string
  outputText: string
  sources: SourceReference[]
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

const typeConfig: Record<QueryOutputType, { label: string; icon: typeof MessageSquare; color: string }> = {
  chat: {
    label: "Chat",
    icon: MessageSquare,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  draft: {
    label: "Draft",
    icon: FileText,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  review_table: {
    label: "Review table",
    icon: TableIcon,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  analysis: {
    label: "Analysis",
    icon: BarChart3,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
}

const sourceTypeConfig: Record<string, { icon: typeof Database; label: string }> = {
  vault: { icon: Database, label: "Vault" },
  document: { icon: FileText, label: "Document" },
  agent: { icon: BookOpen, label: "Agent" },
  external_database: { icon: Globe, label: "External" },
  system_knowledge: { icon: BookOpen, label: "System" },
}

const dateRangeOptions = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "quarter", label: "Past 3 months" },
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`
}

function getDateRange(range: string): { dateFrom?: string; dateTo?: string } {
  if (range === "all") return {}

  const now = new Date()
  const cutoff = new Date()

  switch (range) {
    case "today":
      cutoff.setHours(0, 0, 0, 0)
      break
    case "week":
      cutoff.setDate(now.getDate() - 7)
      break
    case "month":
      cutoff.setMonth(now.getMonth() - 1)
      break
    case "quarter":
      cutoff.setMonth(now.getMonth() - 3)
      break
  }

  return { dateFrom: cutoff.toISOString() }
}

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("all")
  const [page, setPage] = useState(1)
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString())

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1) // reset page on new search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page on date range change
  useEffect(() => {
    setPage(1)
  }, [dateRange])

  // Fetch history from API
  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      const { dateFrom } = getDateRange(dateRange)
      if (dateFrom) params.set("dateFrom", dateFrom)
      params.set("page", String(page))
      params.set("limit", "50")

      const res = await fetch(`/api/history?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch history")
      const data = await res.json()

      setHistory(data.entries || [])
      setPagination(data.pagination || null)
      setLastUpdated(new Date().toISOString())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch history")
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, dateRange, page])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleRowClick = (entry: HistoryEntry) => {
    setSelectedEntry(entry)
    setIsDetailOpen(true)
  }

  const handleOpenInAssistant = (entry: HistoryEntry) => {
    setIsDetailOpen(false)
    router.push(`/assistant?queryId=${entry.queryId}`)
  }

  return (
    <>
      <PageHeader title="History" />

      <div className="flex flex-col gap-6">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Date range filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Clock className="mr-2 h-4 w-4" />
                  {dateRangeOptions.find((o) => o.value === dateRange)?.label}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {dateRangeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setDateRange(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Last updated indicator */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              <span>Updated {formatTime(lastUpdated)}</span>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchHistory}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {/* History table */}
        {!isLoading && !error && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Created</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[140px]">Type</TableHead>
                    <TableHead className="w-[200px]">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Clock className="h-8 w-8" />
                          <span className="font-medium">No results found</span>
                          <span className="text-sm">
                            {searchQuery
                              ? `No history entries match "${searchQuery}"`
                              : "Your query history will appear here"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((entry) => {
                      const typeInfo = typeConfig[entry.type] || typeConfig.chat
                      const TypeIcon = typeInfo.icon
                      return (
                        <TableRow
                          key={entry.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(entry)}
                        >
                          <TableCell className="text-muted-foreground">
                            <div className="flex flex-col">
                              <span className="text-sm">{formatDate(entry.createdAt)}</span>
                              <span className="text-xs">{formatTime(entry.createdAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium line-clamp-1">{entry.title}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={typeInfo.color}>
                              <TypeIcon className="mr-1 h-3 w-3" />
                              {typeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {entry.sourcesSummary ? (
                              <span className="text-sm text-muted-foreground line-clamp-1">
                                {entry.sourcesSummary}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} entries)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Results count (single page) */}
            {pagination && pagination.totalPages <= 1 && history.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Showing {history.length} {history.length === 1 ? "entry" : "entries"}
                {dateRange !== "all" && ` from ${dateRangeOptions.find((o) => o.value === dateRange)?.label.toLowerCase()}`}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="secondary"
                    className={(typeConfig[selectedEntry.type] || typeConfig.chat).color}
                  >
                    {(() => {
                      const TypeIcon = (typeConfig[selectedEntry.type] || typeConfig.chat).icon
                      return <TypeIcon className="mr-1 h-3 w-3" />
                    })()}
                    {(typeConfig[selectedEntry.type] || typeConfig.chat).label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(selectedEntry.createdAt)}
                  </span>
                </div>
                <DialogTitle className="text-lg">{selectedEntry.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Input */}
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Query</h4>
                  <div className="rounded-md bg-muted p-3 text-sm">
                    {selectedEntry.inputText}
                  </div>
                </div>

                {/* Output */}
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Response</h4>
                  <div className="rounded-md border p-3 text-sm">
                    <MarkdownRenderer content={selectedEntry.outputText || ""} />
                  </div>
                </div>

                {/* Sources */}
                {selectedEntry.sources.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Sources</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.sources.map((source) => {
                        const sourceInfo = sourceTypeConfig[source.sourceType] || sourceTypeConfig.vault
                        const SourceIcon = sourceInfo.icon
                        return (
                          <Badge key={source.id} variant="outline">
                            <SourceIcon className="mr-1 h-3 w-3" />
                            {source.sourceName}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Open in Assistant button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOpenInAssistant(selectedEntry)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Assistant
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
