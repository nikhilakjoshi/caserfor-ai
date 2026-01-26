"use client"

import { useState, useRef, useCallback } from "react"
import { useCompletion } from "@ai-sdk/react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Star,
  X,
  Upload,
  File,
  Database,
  Wand2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AttachedFile {
  id: string
  file: File | null  // null for vault file references
  name: string
  size: number
  source: "upload" | "vault"
  vaultId?: string
}

interface VaultFile {
  id: string
  name: string
  type: string
  size: number
}

interface Vault {
  id: string
  name: string
  type: "knowledge_base" | "sandbox"
  fileCount: number
  files: VaultFile[]
}

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

// Mock vaults with files for vault selection modal
const mockVaultsWithFiles: Vault[] = [
  {
    id: "1",
    name: "Client Documents",
    type: "knowledge_base",
    fileCount: 5,
    files: [
      { id: "f1", name: "Agreement_2024.pdf", type: "pdf", size: 245000 },
      { id: "f2", name: "NDA_Template.docx", type: "docx", size: 45000 },
      { id: "f3", name: "Client_Notes.txt", type: "txt", size: 12000 },
      { id: "f4", name: "Contract_Draft.pdf", type: "pdf", size: 189000 },
      { id: "f5", name: "Appendix_A.pdf", type: "pdf", size: 67000 },
    ],
  },
  {
    id: "2",
    name: "Legal Templates",
    type: "knowledge_base",
    fileCount: 3,
    files: [
      { id: "f6", name: "Master_Agreement.docx", type: "docx", size: 98000 },
      { id: "f7", name: "SLA_Template.pdf", type: "pdf", size: 156000 },
      { id: "f8", name: "Privacy_Policy.docx", type: "docx", size: 34000 },
    ],
  },
  {
    id: "3",
    name: "Research Papers",
    type: "sandbox",
    fileCount: 4,
    files: [
      { id: "f9", name: "Case_Study_2023.pdf", type: "pdf", size: 420000 },
      { id: "f10", name: "Legal_Analysis.pdf", type: "pdf", size: 312000 },
      { id: "f11", name: "Market_Research.pdf", type: "pdf", size: 567000 },
      { id: "f12", name: "Regulatory_Review.docx", type: "docx", size: 89000 },
    ],
  },
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const DEFAULT_PLACEHOLDER = "Ask anything. Type @ to add sources."

export default function AssistantPage() {
  const [query, setQuery] = useState("")
  const [outputType, setOutputType] = useState<OutputType>("draft")
  const [selectedVaults, setSelectedVaults] = useState<string[]>([])
  const [deepAnalysis, setDeepAnalysis] = useState(false)
  const [showVaultSelector, setShowVaultSelector] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showVaultModal, setShowVaultModal] = useState(false)
  const [selectedVaultForFiles, setSelectedVaultForFiles] = useState<Vault | null>(null)
  const [selectedVaultFiles, setSelectedVaultFiles] = useState<string[]>([])
  const [hoveredPrompt, setHoveredPrompt] = useState<Prompt | null>(null)
  const [isImproving, setIsImproving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { completion, isLoading, complete, error } = useCompletion({
    api: "/api/assistant/query",
  })

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles: AttachedFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      source: "upload" as const,
    }))
    setAttachedFiles((prev) => [...prev, ...newFiles])
  }, [])

  const removeFile = useCallback((id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }, [addFiles])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
      e.target.value = "" // Reset for re-selection
    }
  }, [addFiles])

  const toggleVault = (vaultId: string) => {
    setSelectedVaults((prev) =>
      prev.includes(vaultId)
        ? prev.filter((id) => id !== vaultId)
        : [...prev, vaultId]
    )
  }

  const handleVaultSelect = (vault: Vault) => {
    setSelectedVaultForFiles(vault)
    setSelectedVaultFiles([])
  }

  const toggleVaultFileSelection = (fileId: string) => {
    setSelectedVaultFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    )
  }

  const confirmVaultFileSelection = () => {
    if (!selectedVaultForFiles) return

    const filesToAdd: AttachedFile[] = selectedVaultForFiles.files
      .filter((f) => selectedVaultFiles.includes(f.id))
      .map((f) => ({
        id: `vault-${f.id}`,
        file: null, // Vault files are references, not actual File objects
        name: f.name,
        size: f.size,
        source: "vault" as const,
        vaultId: selectedVaultForFiles.id,
      }))

    setAttachedFiles((prev) => [...prev, ...filesToAdd])
    setShowVaultModal(false)
    setSelectedVaultForFiles(null)
    setSelectedVaultFiles([])
  }

  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return

    const sources = selectedVaults.map((id) => {
      const vault = mockVaults.find((v) => v.id === id)
      return vault ? { id, name: vault.name } : null
    }).filter(Boolean)

    // Build attached files metadata for API
    const files = attachedFiles.map((af) => ({
      id: af.id,
      name: af.name,
      size: af.size,
      source: af.source,
      vaultId: af.vaultId,
    }))

    await complete(query, {
      body: {
        inputText: query,
        outputType,
        sources,
        deepAnalysis,
        attachedFiles: files,
      },
    })
  }

  const hasResponse = completion.length > 0

  // Get starred prompts first, then others
  const sortedPrompts = [...mockPrompts].sort((a, b) => {
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
    setHoveredPrompt(null)
  }

  const handleImprove = async () => {
    if (!query.trim() || isImproving || isLoading) return

    setIsImproving(true)
    try {
      const response = await fetch("/api/assistant/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: query }),
      })

      if (!response.ok) {
        throw new Error("Failed to improve prompt")
      }

      // Stream the response and build up the improved prompt
      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let improvedText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        improvedText += decoder.decode(value, { stream: true })
        setQuery(improvedText)
      }
    } catch (error) {
      console.error("Error improving prompt:", error)
    } finally {
      setIsImproving(false)
    }
  }

  // Compute placeholder - shows hovered prompt preview or default
  const textareaPlaceholder = hoveredPrompt
    ? hoveredPrompt.content.slice(0, 100) + (hoveredPrompt.content.length > 100 ? "..." : "")
    : DEFAULT_PLACEHOLDER

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
          {/* Unified Chat Input Container */}
          <div className="border rounded bg-background">
            {/* Textarea */}
            <Textarea
              placeholder={textareaPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[100px] resize-none text-base border-0 focus-visible:ring-0 rounded-b-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit()
                }
              }}
              disabled={isLoading}
            />
            {/* Embedded Button Row */}
            <div className="flex items-center gap-2 p-2 border-t bg-muted/30">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8"
                    disabled={isLoading}
                  >
                    <Paperclip className="h-4 w-4" />
                    Files & Sources
                    {attachedFiles.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                        {attachedFiles.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>File Actions</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4" />
                      Upload Files
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Sources</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setShowVaultModal(true)}>
                      <Database className="h-4 w-4" />
                      Add From Vault
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu onOpenChange={(open) => !open && setHoveredPrompt(null)}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8"
                    disabled={isLoading}
                  >
                    <BookOpen className="h-4 w-4" />
                    Prompts
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto">
                  <DropdownMenuLabel>Saved Prompts</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {sortedPrompts.map((prompt) => (
                    <DropdownMenuItem
                      key={prompt.id}
                      onClick={() => insertPrompt(prompt)}
                      onMouseEnter={() => setHoveredPrompt(prompt)}
                      onMouseLeave={() => setHoveredPrompt(null)}
                      className="flex flex-col items-start gap-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        {prompt.isStarred && (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                        )}
                        <span className="font-medium text-sm truncate">{prompt.name}</span>
                        {prompt.ownerType === "personal" && (
                          <Badge variant="outline" className="text-xs ml-auto shrink-0">
                            Personal
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 w-full">
                        {prompt.content}
                      </p>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-8"
                disabled={isLoading || isImproving || !query.trim()}
                onClick={handleImprove}
              >
                {isImproving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Improving
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Improve
                  </>
                )}
              </Button>
              {/* Spacer */}
              <div className="flex-1" />
              {/* Ask Button - right aligned */}
              <Button
                onClick={handleSubmit}
                disabled={!query.trim() || isLoading}
                size="sm"
                className="h-8"
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

            {/* Hidden file input for Upload Files action */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />

            {/* Attached files display */}
            {attachedFiles.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {attachedFiles.length} file{attachedFiles.length !== 1 ? "s" : ""} attached
                  </span>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {attachedFiles.map((af) => (
                    <div
                      key={af.id}
                      className="flex items-center gap-2 p-2 bg-background rounded text-sm"
                    >
                      <File className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{af.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatFileSize(af.size)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeFile(af.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
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

      {/* Vault Selection Modal */}
      <Dialog open={showVaultModal} onOpenChange={setShowVaultModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add From Vault</DialogTitle>
            <DialogDescription>
              Select a vault and choose files to attach to your query.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex gap-4 min-h-0">
            {/* Vault List */}
            <div className="w-48 shrink-0 border-r pr-4 overflow-y-auto">
              <div className="space-y-1">
                {mockVaultsWithFiles.map((vault) => (
                  <button
                    key={vault.id}
                    onClick={() => handleVaultSelect(vault)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors flex items-center gap-2 ${
                      selectedVaultForFiles?.id === vault.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {vault.type === "knowledge_base" ? (
                      <Database className="h-4 w-4 shrink-0" />
                    ) : (
                      <Folder className="h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">{vault.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {vault.fileCount}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto">
              {selectedVaultForFiles ? (
                <div className="space-y-1">
                  {selectedVaultForFiles.files.map((file) => {
                    const isSelected = selectedVaultFiles.includes(file.id)
                    return (
                      <button
                        key={file.id}
                        onClick={() => toggleVaultFileSelection(file.id)}
                        className={`w-full text-left p-2 rounded text-sm transition-colors flex items-center gap-2 ${
                          isSelected ? "bg-primary/10 border border-primary" : "hover:bg-muted border border-transparent"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <File className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatFileSize(file.size)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Select a vault to view files
                </div>
              )}
            </div>
          </div>

          {/* Footer with actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedVaultFiles.length} file{selectedVaultFiles.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVaultModal(false)
                  setSelectedVaultForFiles(null)
                  setSelectedVaultFiles([])
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmVaultFileSelection}
                disabled={selectedVaultFiles.length === 0}
              >
                Add {selectedVaultFiles.length > 0 ? `${selectedVaultFiles.length} ` : ""}File{selectedVaultFiles.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
