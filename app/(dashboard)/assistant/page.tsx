"use client"

import { useState } from "react"
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
} from "lucide-react"

type OutputType = "draft" | "review_table"

interface VaultSource {
  id: string
  name: string
  selected: boolean
}

// Mock data - will be replaced with API calls
const mockVaults: VaultSource[] = [
  { id: "1", name: "Client Documents", selected: false },
  { id: "2", name: "Legal Templates", selected: false },
  { id: "3", name: "Research Papers", selected: false },
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

export default function AssistantPage() {
  const [query, setQuery] = useState("")
  const [outputType, setOutputType] = useState<OutputType>("draft")
  const [selectedVaults, setSelectedVaults] = useState<string[]>([])
  const [deepAnalysis, setDeepAnalysis] = useState(false)
  const [showVaultSelector, setShowVaultSelector] = useState(false)

  const toggleVault = (vaultId: string) => {
    setSelectedVaults((prev) =>
      prev.includes(vaultId)
        ? prev.filter((id) => id !== vaultId)
        : [...prev, vaultId]
    )
  }

  const handleSubmit = () => {
    if (!query.trim()) return
    // TODO: implement query submission
    console.log({
      query,
      outputType,
      selectedVaults,
      deepAnalysis,
    })
  }

  return (
    <>
      <PageHeader title="Assistant" />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4 py-8">
        {/* Title/Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Legal Workflow</h1>
          <p className="text-lg text-muted-foreground">AI-powered legal document analysis</p>
        </div>

        {/* Main Input Area */}
        <div className="w-full max-w-2xl space-y-4">
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
            />
            <Button
              onClick={handleSubmit}
              disabled={!query.trim()}
              className="absolute bottom-3 right-3"
              size="sm"
            >
              Ask
              <ArrowRight className="ml-1 h-4 w-4" />
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
              >
                <FileText className="h-4 w-4" />
                Draft document
              </Toggle>
              <Toggle
                pressed={outputType === "review_table"}
                onPressedChange={() => setOutputType("review_table")}
                size="sm"
                className="gap-1.5"
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
              >
                <Folder className="h-4 w-4" />
                Choose vault
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Paperclip className="h-4 w-4" />
                Files and sources
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
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
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {vault.name}
                    </Button>
                  )
                })}
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

        {/* Recommended Workflows */}
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
      </div>
    </>
  )
}
