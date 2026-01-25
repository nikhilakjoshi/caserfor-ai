"use client"

import { useState } from "react"
import { useCompletion } from "@ai-sdk/react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Table2,
  Folder,
  Paperclip,
  BookOpen,
  Sparkles,
  ArrowRight,
  Check,
  Loader2,
  Search,
  Star,
  X,
} from "lucide-react"

type OutputType = "draft" | "review_table"
type OwnerType = "system" | "personal"

interface VaultSource {
  id: string
  name: string
}

interface Prompt {
  id: string
  name: string
  content: string
  ownerType: OwnerType
  category: string | null
  isStarred: boolean
}

// Mock data - will be replaced with API calls
const mockVaults: VaultSource[] = [
  { id: "1", name: "Client Documents" },
  { id: "2", name: "Legal Templates" },
  { id: "3", name: "Research Papers" },
]

const recommendedWorkflows = [
  {
    id: "1",
    name: "Draft Client Alert",
    description: "Generate client-facing alerts from source documents",
    outputType: "draft" as const,
    category: "General",
  },
  {
    id: "2",
    name: "Extract Key Data",
    description: "Pull structured data from agreements",
    outputType: "extraction" as const,
    category: "Transactional",
  },
  {
    id: "3",
    name: "Summarize Calls",
    description: "Create summaries from meeting transcripts",
    outputType: "draft" as const,
    category: "General",
  },
  {
    id: "4",
    name: "Review Table",
    description: "Build comparison tables from multiple docs",
    outputType: "review_table" as const,
    category: "Transactional",
  },
]

// Mock prompts - will be replaced with API call to /api/prompts
const mockPrompts: Prompt[] = [
  {
    id: "1",
    name: "Contract Summary",
    content: "Summarize the key terms of this contract including parties, effective date, term, and material obligations.",
    ownerType: "system",
    category: "analysis",
    isStarred: true,
  },
  {
    id: "2",
    name: "Risk Identification",
    content: "Identify and list all potential legal risks in this document, categorized by severity (high, medium, low).",
    ownerType: "system",
    category: "review",
    isStarred: false,
  },
  {
    id: "3",
    name: "Change of Control Analysis",
    content: "Analyze all change of control provisions and their implications for the transaction.",
    ownerType: "system",
    category: "transactional",
    isStarred: false,
  },
  {
    id: "4",
    name: "My Custom Review Prompt",
    content: "Review this document for compliance with our internal policies on data retention and privacy.",
    ownerType: "personal",
    category: "compliance",
    isStarred: true,
  },
  {
    id: "5",
    name: "Timeline Extraction",
    content: "Extract all dates and deadlines from this document and present them in chronological order with context.",
    ownerType: "system",
    category: "extraction",
    isStarred: false,
  },
  {
    id: "6",
    name: "Clause Comparison",
    content: "Compare the indemnification clauses across the provided documents and highlight key differences.",
    ownerType: "system",
    category: "review",
    isStarred: false,
  },
]

export default function AssistantPage() {
  const [query, setQuery] = useState("")
  const [outputType, setOutputType] = useState<OutputType>("draft")
  const [selectedVaults, setSelectedVaults] = useState<string[]>([])
  const [deepAnalysis, setDeepAnalysis] = useState(false)
  const [showVaultSelector, setShowVaultSelector] = useState(false)
  const [showPromptSelector, setShowPromptSelector] = useState(false)
  const [promptSearchQuery, setPromptSearchQuery] = useState("")

  const { completion, isLoading, complete, error } = useCompletion({
    api: "/api/assistant/query",
  })

  const toggleVault = (vaultId: string) => {
    setSelectedVaults((prev) =>
      prev.includes(vaultId)
        ? prev.filter((id) => id !== vaultId)
        : [...prev, vaultId]
    )
  }

  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return

    const sources = selectedVaults.map((id) => {
      const vault = mockVaults.find((v) => v.id === id)
      return vault ? { id, name: vault.name } : null
    }).filter(Boolean)

    await complete(query, {
      body: {
        inputText: query,
        outputType,
        sources,
        deepAnalysis,
      },
    })
  }

  const hasResponse = completion.length > 0

  // Filter prompts based on search query
  const filteredPrompts = mockPrompts.filter(
    (p) =>
      p.name.toLowerCase().includes(promptSearchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(promptSearchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(promptSearchQuery.toLowerCase()))
  )

  // Get starred prompts first, then others
  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    if (a.isStarred && !b.isStarred) return -1
    if (!a.isStarred && b.isStarred) return 1
    return 0
  })

  const insertPrompt = (prompt: Prompt) => {
    const currentQuery = query.trim()
    const newQuery = currentQuery
      ? `${currentQuery}\n\n${prompt.content}`
      : prompt.content
    setQuery(newQuery)
    setShowPromptSelector(false)
    setPromptSearchQuery("")
  }

  return (
    <>
      <PageHeader title="Assistant" />
      <div className="flex flex-col items-center min-h-[60vh] gap-8 px-4 py-8">
        {/* Title/Logo - only show when no response */}
        {!hasResponse && (
          <div className="text-center space-y-2 mt-[10vh]">
            <h1 className="text-4xl font-bold tracking-tight">Legal Workflow</h1>
            <p className="text-lg text-muted-foreground">AI-powered legal document analysis</p>
          </div>
        )}

        {/* Response Area */}
        {hasResponse && (
          <div className="w-full max-w-3xl">
            <div className="mb-4 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Query:</p>
              <p>{query}</p>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap">{completion}</div>
              {isLoading && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="w-full max-w-2xl p-4 bg-destructive/10 text-destructive rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        {/* Main Input Area */}
        <div className={`w-full max-w-2xl space-y-4 ${hasResponse ? "mt-auto" : ""}`}>
          {/* Query Input */}
          <div className="relative">
            <Textarea
              placeholder="Ask anything. Type @ to add sources."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[120px] resize-none pr-20 text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit()
                }
              }}
              disabled={isLoading}
            />
            <Button
              onClick={handleSubmit}
              disabled={!query.trim() || isLoading}
              className="absolute bottom-3 right-3"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : (
                <>
                  Ask
                  <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Output Type Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Output:</span>
            <div className="flex gap-1">
              <Toggle
                pressed={outputType === "draft"}
                onPressedChange={() => setOutputType("draft")}
                size="sm"
                className="gap-1.5"
                disabled={isLoading}
              >
                <FileText className="h-4 w-4" />
                Draft document
              </Toggle>
              <Toggle
                pressed={outputType === "review_table"}
                onPressedChange={() => setOutputType("review_table")}
                size="sm"
                className="gap-1.5"
                disabled={isLoading}
              >
                <Table2 className="h-4 w-4" />
                Review table
              </Toggle>
            </div>
          </div>

          {/* Source Selector */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVaultSelector(!showVaultSelector)}
                className="gap-1.5"
                disabled={isLoading}
              >
                <Folder className="h-4 w-4" />
                Choose vault
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" disabled={isLoading}>
                <Paperclip className="h-4 w-4" />
                Files and sources
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPromptSelector(!showPromptSelector)}
                className="gap-1.5"
                disabled={isLoading}
              >
                <BookOpen className="h-4 w-4" />
                Prompts
              </Button>
            </div>

            {/* Vault Selection Dropdown */}
            {showVaultSelector && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md">
                {mockVaults.map((vault) => {
                  const isSelected = selectedVaults.includes(vault.id)
                  return (
                    <Button
                      key={vault.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleVault(vault.id)}
                      className="gap-1.5"
                      disabled={isLoading}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {vault.name}
                    </Button>
                  )
                })}
              </div>
            )}

            {/* Prompt Selector Panel */}
            {showPromptSelector && (
              <div className="p-3 bg-muted/50 rounded-md space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search prompts..."
                      value={promptSearchQuery}
                      onChange={(e) => setPromptSearchQuery(e.target.value)}
                      className="pl-8 h-8"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setShowPromptSelector(false)
                      setPromptSearchQuery("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {sortedPrompts.length > 0 ? (
                    sortedPrompts.map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => insertPrompt(prompt)}
                        className="w-full text-left p-2 rounded hover:bg-background transition-colors flex items-start gap-2"
                      >
                        {prompt.isStarred && (
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{prompt.name}</span>
                            {prompt.category && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {prompt.category}
                              </Badge>
                            )}
                            {prompt.ownerType === "personal" && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                Personal
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {prompt.content}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No prompts found
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Selected Sources Indicator */}
            {selectedVaults.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Sources:</span>
                {selectedVaults.map((id) => {
                  const vault = mockVaults.find((v) => v.id === id)
                  return vault ? (
                    <Badge key={id} variant="secondary">
                      {vault.name}
                    </Badge>
                  ) : null
                })}
              </div>
            )}
          </div>

          {/* Deep Analysis Toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="deep-analysis"
              checked={deepAnalysis}
              onCheckedChange={(checked) => setDeepAnalysis(checked === true)}
              disabled={isLoading}
            />
            <label
              htmlFor="deep-analysis"
              className="text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Deep analysis
            </label>
            <span className="text-xs text-muted-foreground">
              (Extended processing for complex queries)
            </span>
          </div>
        </div>

        {/* Recommended Workflows - only show when no response */}
        {!hasResponse && (
          <div className="w-full max-w-4xl space-y-4 mt-8">
            <h2 className="text-lg font-semibold">Recommended workflows</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedWorkflows.map((workflow) => (
                <Card
                  key={workflow.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{workflow.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {workflow.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="text-xs">
                      {workflow.outputType === "draft" && "Draft"}
                      {workflow.outputType === "review_table" && "Review table"}
                      {workflow.outputType === "extraction" && "Extraction"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
