"use client"

import { useState } from "react"
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
} from "lucide-react"

type QueryOutputType = "chat" | "draft" | "review_table" | "analysis"
type SourceType = "vault" | "external_database" | "system_knowledge"

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

// Mock data - replace with API call
const mockHistory: HistoryEntry[] = [
  {
    id: "h1",
    queryId: "q1",
    title: "Summarize the key terms in the purchase agreement",
    type: "chat",
    sourcesSummary: "M&A Deal Documents",
    createdAt: "2026-01-25T14:30:00Z",
    inputText: "Summarize the key terms in the purchase agreement, focusing on the representations and warranties section.",
    outputText: "Based on my analysis of the Purchase Agreement, here are the key terms:\n\n**Purchase Price**: $50M base with earnout provisions up to $15M\n\n**Representations & Warranties**:\n- Standard corporate representations (organization, authority, capitalization)\n- Financial statements warranted accurate per GAAP\n- No undisclosed liabilities exceeding $100K\n- IP ownership and non-infringement warranties\n- Employee benefit plans compliance\n\n**Key Covenants**:\n- Non-compete for 3 years within 50-mile radius\n- Employee retention commitments for key personnel\n\n**Indemnification**:\n- Cap at 15% of purchase price\n- Basket of $500K with deductible structure",
    sources: [
      { id: "s1", sourceType: "vault", sourceId: "v1", sourceName: "M&A Deal Documents" },
    ],
  },
  {
    id: "h2",
    queryId: "q2",
    title: "Draft a client alert on the new SEC regulations",
    type: "draft",
    sourcesSummary: "SEC Regulatory Updates",
    createdAt: "2026-01-25T11:15:00Z",
    inputText: "Draft a client alert summarizing the new SEC regulations on climate disclosure requirements.",
    outputText: "**CLIENT ALERT**\n\n**New SEC Climate Disclosure Requirements: What Companies Need to Know**\n\nThe Securities and Exchange Commission has adopted final rules requiring registrants to disclose climate-related information in their registration statements and annual reports.\n\n**Key Requirements:**\n\n1. **Disclosure of Climate-Related Risks** - Companies must describe material climate-related risks and their actual or potential impacts on strategy, operations, and financial condition.\n\n2. **Governance Disclosure** - Board oversight and management's role in assessing and managing climate risks must be disclosed.\n\n3. **GHG Emissions Reporting** - Large accelerated filers must report Scope 1 and 2 emissions, with limited Scope 3 disclosure.\n\n**Effective Dates:**\n- Large accelerated filers: FY 2025\n- Accelerated filers: FY 2026\n- Smaller reporting companies: FY 2027\n\n**Action Items for Clients:**\n- Assess current climate risk management processes\n- Evaluate GHG emissions tracking capabilities\n- Review board and management governance structures",
    sources: [
      { id: "s2", sourceType: "vault", sourceId: "v2", sourceName: "SEC Regulatory Updates" },
      { id: "s3", sourceType: "system_knowledge", sourceId: "sk1", sourceName: "Legal Research" },
    ],
  },
  {
    id: "h3",
    queryId: "q3",
    title: "Extract key dates from the credit agreement",
    type: "review_table",
    sourcesSummary: "Credit Facility Documents",
    createdAt: "2026-01-24T16:45:00Z",
    inputText: "Extract all key dates and deadlines from the credit agreement into a table format.",
    outputText: "| Date | Event | Reference |\n|------|-------|----------|\n| 2026-03-31 | Financial Covenant Testing | Section 7.1 |\n| 2026-06-30 | Annual Audit Delivery | Section 6.2(a) |\n| 2026-12-31 | Commitment Termination | Section 2.4 |\n| 2027-06-30 | Maturity Date | Section 2.3 |\n| Quarterly | Compliance Certificate | Section 6.2(c) |",
    sources: [
      { id: "s4", sourceType: "vault", sourceId: "v3", sourceName: "Credit Facility Documents" },
    ],
  },
  {
    id: "h4",
    queryId: "q4",
    title: "Analyze change of control provisions",
    type: "analysis",
    sourcesSummary: "Multiple sources",
    createdAt: "2026-01-24T09:20:00Z",
    inputText: "Perform a deep analysis of the change of control provisions across all deal documents and identify any inconsistencies.",
    outputText: "**Deep Analysis: Change of Control Provisions**\n\n**Summary of Findings:**\nAfter analyzing 12 documents across the transaction, I identified 3 areas of potential concern.\n\n**Key Inconsistencies:**\n\n1. **Definition Variance** - The Credit Agreement defines CoC at 35% ownership threshold, while the Purchase Agreement uses 50%. This could trigger defaults under the Credit Agreement before the Purchase Agreement CoC provisions apply.\n\n2. **Consent Requirements** - The employment agreements require Board consent for CoC-related terminations, but the definition of \"Board\" post-closing is ambiguous.\n\n3. **Timing Misalignment** - Put options under the equity incentive plan become exercisable 30 days post-CoC, but the Credit Agreement requires prepayment within 10 days.\n\n**Recommendations:**\n- Harmonize CoC definitions across documents\n- Clarify post-closing governance terms\n- Negotiate Credit Agreement amendment for timing alignment",
    sources: [
      { id: "s5", sourceType: "vault", sourceId: "v1", sourceName: "M&A Deal Documents" },
      { id: "s6", sourceType: "vault", sourceId: "v3", sourceName: "Credit Facility Documents" },
      { id: "s7", sourceType: "external_database", sourceId: "db1", sourceName: "Practical Law" },
    ],
  },
  {
    id: "h5",
    queryId: "q5",
    title: "What are the indemnification caps?",
    type: "chat",
    sourcesSummary: "M&A Deal Documents",
    createdAt: "2026-01-23T15:00:00Z",
    inputText: "What are the indemnification caps in the purchase agreement?",
    outputText: "The Purchase Agreement contains the following indemnification caps:\n\n- **General Cap**: 15% of purchase price ($7.5M)\n- **Fundamental Representations**: 100% of purchase price\n- **Tax Indemnity**: Uncapped\n- **Fraud**: Uncapped\n\nThe basket is $500,000 with a true deductible (not tipping basket). Survival period is 18 months for general reps, 6 years for fundamental reps.",
    sources: [
      { id: "s8", sourceType: "vault", sourceId: "v1", sourceName: "M&A Deal Documents" },
    ],
  },
]

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

const sourceTypeConfig: Record<SourceType, { icon: typeof Database; label: string }> = {
  vault: { icon: Database, label: "Vault" },
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

const groupByOptions = [
  { value: "none", label: "None" },
  { value: "date", label: "Date" },
  { value: "type", label: "Type" },
  { value: "source", label: "Source" },
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

function filterByDateRange(entries: HistoryEntry[], range: string): HistoryEntry[] {
  if (range === "all") return entries

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

  return entries.filter((e) => new Date(e.createdAt) >= cutoff)
}

export default function HistoryPage() {
  const [history] = useState<HistoryEntry[]>(mockHistory)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("all")
  const [groupBy, setGroupBy] = useState("none")
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [lastUpdated] = useState(new Date().toISOString())

  // Filter by search
  const searchFiltered = history.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.sourcesSummary?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter by date range
  const dateFiltered = filterByDateRange(searchFiltered, dateRange)

  // Sort by date descending
  const sortedHistory = [...dateFiltered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const handleRowClick = (entry: HistoryEntry) => {
    setSelectedEntry(entry)
    setIsDetailOpen(true)
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

            {/* Group by */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Group by: {groupByOptions.find((o) => o.value === groupBy)?.label}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {groupByOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setGroupBy(option.value)}
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

        {/* History table */}
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
              {sortedHistory.length === 0 ? (
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
                sortedHistory.map((entry) => {
                  const typeInfo = typeConfig[entry.type]
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

        {/* Results count */}
        {sortedHistory.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing {sortedHistory.length} {sortedHistory.length === 1 ? "entry" : "entries"}
            {dateRange !== "all" && ` from ${dateRangeOptions.find((o) => o.value === dateRange)?.label.toLowerCase()}`}
          </div>
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
                    className={typeConfig[selectedEntry.type].color}
                  >
                    {(() => {
                      const TypeIcon = typeConfig[selectedEntry.type].icon
                      return <TypeIcon className="mr-1 h-3 w-3" />
                    })()}
                    {typeConfig[selectedEntry.type].label}
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
                  <div className="rounded-md border p-3 text-sm whitespace-pre-wrap">
                    {selectedEntry.outputText}
                  </div>
                </div>

                {/* Sources */}
                {selectedEntry.sources.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Sources</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.sources.map((source) => {
                        const sourceInfo = sourceTypeConfig[source.sourceType]
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
