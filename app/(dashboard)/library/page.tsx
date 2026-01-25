"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FileText,
  BookOpen,
  Star,
  Search,
  Plus,
  ArrowLeft,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type OwnerType = "system" | "personal"

interface Prompt {
  id: string
  name: string
  content: string
  ownerType: OwnerType
  category: string | null
  isActive: boolean
  createdAt: string
  isStarred: boolean
}

interface Example {
  id: string
  name: string
  promptText: string
  documentRef: string | null
  response: string
  ownerType: OwnerType
  createdAt: string
  isStarred: boolean
}

// Mock data - replace with API calls
const mockPrompts: Prompt[] = [
  {
    id: "1",
    name: "Contract Summary",
    content: "Summarize the key terms of this contract including parties, effective date, term, and material obligations.",
    ownerType: "system",
    category: "analysis",
    isActive: true,
    createdAt: "2026-01-10",
    isStarred: true,
  },
  {
    id: "2",
    name: "Risk Identification",
    content: "Identify and list all potential legal risks in this document, categorized by severity (high, medium, low).",
    ownerType: "system",
    category: "review",
    isActive: true,
    createdAt: "2026-01-10",
    isStarred: false,
  },
  {
    id: "3",
    name: "Change of Control Analysis",
    content: "Analyze all change of control provisions and their implications for the transaction.",
    ownerType: "system",
    category: "transactional",
    isActive: true,
    createdAt: "2026-01-10",
    isStarred: false,
  },
  {
    id: "4",
    name: "My Custom Review Prompt",
    content: "Review this document for compliance with our internal policies on data retention and privacy.",
    ownerType: "personal",
    category: "compliance",
    isActive: true,
    createdAt: "2026-01-20",
    isStarred: true,
  },
]

const mockExamples: Example[] = [
  {
    id: "1",
    name: "NDA Summary Example",
    promptText: "Summarize the key terms of this NDA",
    documentRef: "Sample_NDA_2026.pdf",
    response: "This Non-Disclosure Agreement between Acme Corp and Beta Inc establishes mutual confidentiality obligations for a period of 3 years. Key terms include: (1) Definition of confidential information covers technical, business, and financial data; (2) Standard exclusions for public information and prior knowledge; (3) Permitted disclosure to employees and contractors on need-to-know basis; (4) Return/destruction of materials upon termination.",
    ownerType: "system",
    createdAt: "2026-01-10",
    isStarred: true,
  },
  {
    id: "2",
    name: "Covenant Extraction Example",
    promptText: "Extract all financial covenants from this credit agreement",
    documentRef: "Credit_Agreement_Draft.pdf",
    response: "Financial Covenants identified:\n1. Minimum Interest Coverage Ratio: 3.0x\n2. Maximum Leverage Ratio: 4.5x declining to 3.5x by Year 3\n3. Minimum Liquidity: $50M\n4. Maximum Capital Expenditures: $25M annually\n5. Restricted Payments basket: $10M per fiscal year",
    ownerType: "system",
    createdAt: "2026-01-12",
    isStarred: false,
  },
  {
    id: "3",
    name: "My Memo Format",
    promptText: "Draft a client memo analyzing the key issues",
    documentRef: null,
    response: "MEMORANDUM\n\nTO: [Client]\nFROM: [Attorney]\nDATE: [Date]\nRE: Analysis of [Matter]\n\nI. EXECUTIVE SUMMARY\n[Brief overview of conclusions]\n\nII. FACTUAL BACKGROUND\n[Relevant facts]\n\nIII. LEGAL ANALYSIS\n[Issue-by-issue analysis]\n\nIV. RECOMMENDATIONS\n[Action items]",
    ownerType: "personal",
    createdAt: "2026-01-18",
    isStarred: false,
  },
]

type ViewMode = "home" | "prompts" | "examples"

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("home")
  const [prompts, setPrompts] = useState<Prompt[]>(mockPrompts)
  const [examples, setExamples] = useState<Example[]>(mockExamples)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [selectedExample, setSelectedExample] = useState<Example | null>(null)
  const [isCreatePromptOpen, setIsCreatePromptOpen] = useState(false)
  const [newPromptName, setNewPromptName] = useState("")
  const [newPromptContent, setNewPromptContent] = useState("")

  const starredPrompts = prompts.filter((p) => p.isStarred)
  const starredExamples = examples.filter((e) => e.isStarred)

  const filteredPrompts = prompts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredExamples = examples.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.promptText.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const togglePromptStar = (id: string) => {
    setPrompts(
      prompts.map((p) =>
        p.id === id ? { ...p, isStarred: !p.isStarred } : p
      )
    )
  }

  const toggleExampleStar = (id: string) => {
    setExamples(
      examples.map((e) =>
        e.id === id ? { ...e, isStarred: !e.isStarred } : e
      )
    )
  }

  const handleCreatePrompt = () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return

    const newPrompt: Prompt = {
      id: String(Date.now()),
      name: newPromptName,
      content: newPromptContent,
      ownerType: "personal",
      category: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      isStarred: false,
    }

    setPrompts([newPrompt, ...prompts])
    setNewPromptName("")
    setNewPromptContent("")
    setIsCreatePromptOpen(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Home view with sections
  if (viewMode === "home") {
    return (
      <>
        <PageHeader title="Library" />

        <div className="flex flex-col gap-8">
          {/* Main sections */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Prompts section */}
            <Card
              className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
              onClick={() => setViewMode("prompts")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Prompts</CardTitle>
                    <CardDescription>
                      Reusable prompts for common legal tasks
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {prompts.length} prompts available ({prompts.filter((p) => p.ownerType === "personal").length} personal)
                </p>
              </CardContent>
            </Card>

            {/* Examples section */}
            <Card
              className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
              onClick={() => setViewMode("examples")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Examples</CardTitle>
                    <CardDescription>
                      Sample prompts and responses for reference
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {examples.length} examples available
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Starred prompts */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">Starred prompts</h2>
            {starredPrompts.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {starredPrompts.map((prompt) => (
                  <Card
                    key={prompt.id}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => {
                      setSelectedPrompt(prompt)
                      setViewMode("prompts")
                    }}
                  >
                    <CardContent className="flex items-start gap-3 pt-4">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{prompt.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {prompt.content}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your starred prompts will appear here
              </p>
            )}
          </div>

          {/* Starred examples */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">Starred examples</h2>
            {starredExamples.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {starredExamples.map((example) => (
                  <Card
                    key={example.id}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => {
                      setSelectedExample(example)
                      setViewMode("examples")
                    }}
                  >
                    <CardContent className="flex items-start gap-3 pt-4">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{example.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {example.promptText}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your starred examples will appear here
              </p>
            )}
          </div>
        </div>
      </>
    )
  }

  // Prompts list view
  if (viewMode === "prompts") {
    return (
      <>
        <PageHeader title="Library" />

        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setViewMode("home")
                setSearchQuery("")
                setSelectedPrompt(null)
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h2 className="text-xl font-semibold">Prompts</h2>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Dialog open={isCreatePromptOpen} onOpenChange={setIsCreatePromptOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New prompt
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create new prompt</DialogTitle>
                  <DialogDescription>
                    Create a personal prompt for reuse in your queries.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="prompt-name">Name</Label>
                    <Input
                      id="prompt-name"
                      placeholder="e.g., Contract Review Checklist"
                      value={newPromptName}
                      onChange={(e) => setNewPromptName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="prompt-content">Content</Label>
                    <Textarea
                      id="prompt-content"
                      placeholder="Enter the prompt text..."
                      value={newPromptContent}
                      onChange={(e) => setNewPromptContent(e.target.value)}
                      rows={6}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreatePromptOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePrompt}
                    disabled={!newPromptName.trim() || !newPromptContent.trim()}
                  >
                    Create prompt
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* System prompts */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">System prompts</h3>
            <div className="flex flex-col gap-2">
              {filteredPrompts
                .filter((p) => p.ownerType === "system")
                .map((prompt) => (
                  <Card
                    key={prompt.id}
                    className={`transition-colors hover:bg-muted/30 ${
                      selectedPrompt?.id === prompt.id ? "border-primary" : ""
                    }`}
                  >
                    <CardContent className="flex items-start gap-4 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePromptStar(prompt.id)
                        }}
                        className="mt-0.5 shrink-0"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            prompt.isStarred
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground hover:text-yellow-400"
                          }`}
                        />
                      </button>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setSelectedPrompt(prompt)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{prompt.name}</p>
                          {prompt.category && (
                            <Badge variant="secondary" className="text-xs">
                              {prompt.category}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {prompt.content}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => copyToClipboard(prompt.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          {/* Personal prompts */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Personal prompts</h3>
            {filteredPrompts.filter((p) => p.ownerType === "personal").length > 0 ? (
              <div className="flex flex-col gap-2">
                {filteredPrompts
                  .filter((p) => p.ownerType === "personal")
                  .map((prompt) => (
                    <Card
                      key={prompt.id}
                      className={`transition-colors hover:bg-muted/30 ${
                        selectedPrompt?.id === prompt.id ? "border-primary" : ""
                      }`}
                    >
                      <CardContent className="flex items-start gap-4 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePromptStar(prompt.id)
                          }}
                          className="mt-0.5 shrink-0"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              prompt.isStarred
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground hover:text-yellow-400"
                            }`}
                          />
                        </button>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setSelectedPrompt(prompt)}
                        >
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{prompt.name}</p>
                            <Badge variant="outline" className="text-xs">
                              Personal
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {prompt.content}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => copyToClipboard(prompt.content)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No personal prompts yet. Create one to get started.
              </p>
            )}
          </div>

          {/* Prompt detail dialog */}
          <Dialog open={!!selectedPrompt} onOpenChange={() => setSelectedPrompt(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedPrompt?.name}
                  {selectedPrompt?.ownerType === "personal" && (
                    <Badge variant="outline" className="text-xs">Personal</Badge>
                  )}
                </DialogTitle>
                {selectedPrompt?.category && (
                  <Badge variant="secondary" className="w-fit">{selectedPrompt.category}</Badge>
                )}
              </DialogHeader>
              <div className="py-4">
                <p className="whitespace-pre-wrap text-sm">{selectedPrompt?.content}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedPrompt(null)}>
                  Close
                </Button>
                <Button onClick={() => selectedPrompt && copyToClipboard(selectedPrompt.content)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy prompt
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </>
    )
  }

  // Examples list view
  if (viewMode === "examples") {
    return (
      <>
        <PageHeader title="Library" />

        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setViewMode("home")
                setSearchQuery("")
                setSelectedExample(null)
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h2 className="text-xl font-semibold">Examples</h2>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search examples..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Examples list */}
          <div className="flex flex-col gap-3">
            {filteredExamples.map((example) => (
              <Card
                key={example.id}
                className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                  selectedExample?.id === example.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedExample(example)}
              >
                <CardContent className="flex items-start gap-4 py-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExampleStar(example.id)
                    }}
                    className="mt-0.5 shrink-0"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        example.isStarred
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground hover:text-yellow-400"
                      }`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{example.name}</p>
                      {example.ownerType === "personal" && (
                        <Badge variant="outline" className="text-xs">Personal</Badge>
                      )}
                    </div>
                    {example.documentRef && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Document: {example.documentRef}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {example.promptText}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredExamples.length === 0 && searchQuery && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No examples found</h3>
                <p className="text-sm text-muted-foreground">
                  No examples match &quot;{searchQuery}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Example detail dialog */}
          <Dialog open={!!selectedExample} onOpenChange={() => setSelectedExample(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedExample?.name}
                  {selectedExample?.ownerType === "personal" && (
                    <Badge variant="outline" className="text-xs">Personal</Badge>
                  )}
                </DialogTitle>
                {selectedExample?.documentRef && (
                  <DialogDescription>
                    Based on: {selectedExample.documentRef}
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Prompt</h4>
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm whitespace-pre-wrap">{selectedExample?.promptText}</p>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Response</h4>
                  <div className="rounded-md border p-3">
                    <p className="text-sm whitespace-pre-wrap">{selectedExample?.response}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedExample(null)}>
                  Close
                </Button>
                <Button onClick={() => selectedExample && copyToClipboard(selectedExample.promptText)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy prompt
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </>
    )
  }

  return null
}
