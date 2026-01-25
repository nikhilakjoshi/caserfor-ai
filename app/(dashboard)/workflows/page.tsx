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
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  ChevronDown,
  FileText,
  Table2,
  ArrowRightLeft,
  Layers,
} from "lucide-react"
import Link from "next/link"

type WorkflowOutputType = "draft" | "review_table" | "extraction" | "transformation"

interface Workflow {
  id: string
  name: string
  description: string
  category: string
  outputType: WorkflowOutputType
  stepCount?: number
  columnCount?: number
  isSystem: boolean
}

// Mock data - replace with API call
const mockWorkflows: Workflow[] = [
  // General category
  {
    id: "1",
    name: "Draft Client Alert",
    description: "Generate client-facing alerts from source documents",
    category: "General",
    outputType: "draft",
    stepCount: 3,
    isSystem: true,
  },
  {
    id: "2",
    name: "Draft from Template",
    description: "Create documents using predefined templates",
    category: "General",
    outputType: "draft",
    stepCount: 4,
    isSystem: true,
  },
  {
    id: "3",
    name: "Extract Timeline",
    description: "Pull chronological events from documents",
    category: "General",
    outputType: "extraction",
    columnCount: 5,
    isSystem: true,
  },
  {
    id: "4",
    name: "Proofread",
    description: "Check for grammar, style, and consistency issues",
    category: "General",
    outputType: "draft",
    stepCount: 2,
    isSystem: true,
  },
  {
    id: "5",
    name: "Summarize Calls",
    description: "Create summaries from meeting transcripts",
    category: "General",
    outputType: "draft",
    stepCount: 3,
    isSystem: true,
  },
  {
    id: "6",
    name: "Transcribe Audio",
    description: "Convert audio recordings to text",
    category: "General",
    outputType: "draft",
    stepCount: 2,
    isSystem: true,
  },
  {
    id: "7",
    name: "Translate",
    description: "Translate documents to different languages",
    category: "General",
    outputType: "transformation",
    stepCount: 2,
    isSystem: true,
  },
  // Transactional category
  {
    id: "8",
    name: "Analyze Change of Control",
    description: "Review change of control provisions across agreements",
    category: "Transactional",
    outputType: "review_table",
    columnCount: 8,
    isSystem: true,
  },
  {
    id: "9",
    name: "Draft Covenants Memo",
    description: "Summarize covenant provisions from credit agreements",
    category: "Transactional",
    outputType: "draft",
    stepCount: 4,
    isSystem: true,
  },
  {
    id: "10",
    name: "Draft Item 1.01",
    description: "Create 8-K Item 1.01 disclosure draft",
    category: "Transactional",
    outputType: "draft",
    stepCount: 3,
    isSystem: true,
  },
  {
    id: "11",
    name: "Extract Key Data",
    description: "Pull structured data from agreements",
    category: "Transactional",
    outputType: "extraction",
    columnCount: 12,
    isSystem: true,
  },
  {
    id: "12",
    name: "Extract Terms from Agreements",
    description: "Identify and extract key terms and definitions",
    category: "Transactional",
    outputType: "review_table",
    columnCount: 6,
    isSystem: true,
  },
]

const outputTypeFilters = [
  { value: "all", label: "All outputs" },
  { value: "draft", label: "Draft" },
  { value: "review_table", label: "Review table" },
  { value: "extraction", label: "Extraction" },
  { value: "transformation", label: "Transformation" },
]

const categoryFilters = [
  { value: "all", label: "All categories" },
  { value: "General", label: "General" },
  { value: "Transactional", label: "Transactional" },
]

const getOutputTypeIcon = (type: WorkflowOutputType) => {
  switch (type) {
    case "draft":
      return FileText
    case "review_table":
      return Table2
    case "extraction":
      return Layers
    case "transformation":
      return ArrowRightLeft
  }
}

const getOutputTypeLabel = (type: WorkflowOutputType) => {
  switch (type) {
    case "draft":
      return "Draft"
    case "review_table":
      return "Review table"
    case "extraction":
      return "Extraction"
    case "transformation":
      return "Transformation"
  }
}

export default function WorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [outputFilter, setOutputFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const filteredWorkflows = mockWorkflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesOutput =
      outputFilter === "all" || workflow.outputType === outputFilter
    const matchesCategory =
      categoryFilter === "all" || workflow.category === categoryFilter
    return matchesSearch && matchesOutput && matchesCategory
  })

  // Group by category
  const categories = [...new Set(filteredWorkflows.map((w) => w.category))]
  const groupedWorkflows = categories.reduce(
    (acc, category) => {
      acc[category] = filteredWorkflows.filter((w) => w.category === category)
      return acc
    },
    {} as Record<string, Workflow[]>
  )

  return (
    <>
      <PageHeader title="Workflows" />

      <div className="flex flex-col gap-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Output:{" "}
                  {outputTypeFilters.find((o) => o.value === outputFilter)?.label}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {outputTypeFilters.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setOutputFilter(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Category:{" "}
                  {categoryFilters.find((o) => o.value === categoryFilter)?.label}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {categoryFilters.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setCategoryFilter(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Workflow Categories */}
        {categories.length > 0 ? (
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category} className="space-y-4">
                <h2 className="text-lg font-semibold">{category}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedWorkflows[category].map((workflow) => {
                    const OutputIcon = getOutputTypeIcon(workflow.outputType)
                    return (
                      <Link
                        key={workflow.id}
                        href={`/workflows/${workflow.id}`}
                      >
                        <Card className="h-full cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                              {workflow.name}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 text-xs">
                              {workflow.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className="gap-1 text-xs"
                              >
                                <OutputIcon className="h-3 w-3" />
                                {getOutputTypeLabel(workflow.outputType)}
                              </Badge>
                              {workflow.stepCount && (
                                <span className="text-xs text-muted-foreground">
                                  {workflow.stepCount} steps
                                </span>
                              )}
                              {workflow.columnCount && (
                                <span className="text-xs text-muted-foreground">
                                  {workflow.columnCount} columns
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No workflows found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `No workflows match "${searchQuery}"`
                : "No workflows available"}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
