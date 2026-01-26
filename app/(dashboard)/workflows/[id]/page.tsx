"use client"

import { useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ArrowLeft,
  FileText,
  Table2,
  ArrowRightLeft,
  Layers,
  Play,
  Upload,
  X,
  Check,
  Loader2,
  File,
  Circle,
} from "lucide-react"

type WorkflowOutputType = "draft" | "review_table" | "extraction" | "transformation"
type WorkflowStepAction = "input" | "process" | "review" | "output"

interface WorkflowStep {
  id: string
  order: number
  name: string
  action: WorkflowStepAction
}

interface Workflow {
  id: string
  name: string
  description: string
  category: string
  outputType: WorkflowOutputType
  stepCount?: number
  columnCount?: number
  steps: WorkflowStep[]
  isSystem: boolean
  promptTemplate?: string
}

// Mock workflow data with steps - replace with API
const mockWorkflows: Record<string, Workflow> = {
  "1": {
    id: "1",
    name: "Draft Client Alert",
    description: "Generate client-facing alerts from source documents. Upload relevant documents and the workflow will extract key information and draft a professional client alert.",
    category: "General",
    outputType: "draft",
    stepCount: 3,
    isSystem: true,
    promptTemplate: "Draft a client alert based on the following documents...",
    steps: [
      { id: "1-1", order: 1, name: "Upload Documents", action: "input" },
      { id: "1-2", order: 2, name: "Extract Key Information", action: "process" },
      { id: "1-3", order: 3, name: "Generate Alert Draft", action: "output" },
    ],
  },
  "2": {
    id: "2",
    name: "Draft from Template",
    description: "Create documents using predefined templates. Select a template and provide context documents to generate a customized draft.",
    category: "General",
    outputType: "draft",
    stepCount: 4,
    isSystem: true,
    steps: [
      { id: "2-1", order: 1, name: "Select Template", action: "input" },
      { id: "2-2", order: 2, name: "Upload Source Documents", action: "input" },
      { id: "2-3", order: 3, name: "Merge and Process", action: "process" },
      { id: "2-4", order: 4, name: "Generate Draft", action: "output" },
    ],
  },
  "3": {
    id: "3",
    name: "Extract Timeline",
    description: "Pull chronological events from documents and organize them into a structured timeline with dates, events, and relevant context.",
    category: "General",
    outputType: "extraction",
    columnCount: 5,
    isSystem: true,
    steps: [
      { id: "3-1", order: 1, name: "Upload Documents", action: "input" },
      { id: "3-2", order: 2, name: "Identify Temporal References", action: "process" },
      { id: "3-3", order: 3, name: "Extract and Organize Events", action: "output" },
    ],
  },
  "4": {
    id: "4",
    name: "Proofread",
    description: "Check for grammar, style, and consistency issues. Upload your document for comprehensive review and suggested corrections.",
    category: "General",
    outputType: "draft",
    stepCount: 2,
    isSystem: true,
    steps: [
      { id: "4-1", order: 1, name: "Upload Document", action: "input" },
      { id: "4-2", order: 2, name: "Review and Correct", action: "output" },
    ],
  },
  "5": {
    id: "5",
    name: "Summarize Calls",
    description: "Create summaries from meeting transcripts including key points, action items, and participant contributions.",
    category: "General",
    outputType: "draft",
    stepCount: 3,
    isSystem: true,
    steps: [
      { id: "5-1", order: 1, name: "Upload Transcript", action: "input" },
      { id: "5-2", order: 2, name: "Analyze Content", action: "process" },
      { id: "5-3", order: 3, name: "Generate Summary", action: "output" },
    ],
  },
  "6": {
    id: "6",
    name: "Transcribe Audio",
    description: "Convert audio recordings to text with speaker identification and timestamps.",
    category: "General",
    outputType: "draft",
    stepCount: 2,
    isSystem: true,
    steps: [
      { id: "6-1", order: 1, name: "Upload Audio", action: "input" },
      { id: "6-2", order: 2, name: "Transcribe", action: "output" },
    ],
  },
  "7": {
    id: "7",
    name: "Translate",
    description: "Translate documents to different languages while preserving formatting and legal terminology.",
    category: "General",
    outputType: "transformation",
    stepCount: 2,
    isSystem: true,
    steps: [
      { id: "7-1", order: 1, name: "Upload Document", action: "input" },
      { id: "7-2", order: 2, name: "Translate Content", action: "output" },
    ],
  },
  "8": {
    id: "8",
    name: "Analyze Change of Control",
    description: "Review change of control provisions across multiple agreements and compile findings into a structured review table.",
    category: "Transactional",
    outputType: "review_table",
    columnCount: 8,
    isSystem: true,
    steps: [
      { id: "8-1", order: 1, name: "Upload Agreements", action: "input" },
      { id: "8-2", order: 2, name: "Identify Provisions", action: "process" },
      { id: "8-3", order: 3, name: "Extract and Compare", action: "process" },
      { id: "8-4", order: 4, name: "Generate Review Table", action: "output" },
    ],
  },
  "9": {
    id: "9",
    name: "Draft Covenants Memo",
    description: "Summarize covenant provisions from credit agreements into a comprehensive memo format.",
    category: "Transactional",
    outputType: "draft",
    stepCount: 4,
    isSystem: true,
    steps: [
      { id: "9-1", order: 1, name: "Upload Credit Agreement", action: "input" },
      { id: "9-2", order: 2, name: "Identify Covenants", action: "process" },
      { id: "9-3", order: 3, name: "Analyze Terms", action: "process" },
      { id: "9-4", order: 4, name: "Draft Memo", action: "output" },
    ],
  },
  "10": {
    id: "10",
    name: "Draft Item 1.01",
    description: "Create 8-K Item 1.01 disclosure draft from transaction documents.",
    category: "Transactional",
    outputType: "draft",
    stepCount: 3,
    isSystem: true,
    steps: [
      { id: "10-1", order: 1, name: "Upload Transaction Documents", action: "input" },
      { id: "10-2", order: 2, name: "Extract Material Terms", action: "process" },
      { id: "10-3", order: 3, name: "Draft Disclosure", action: "output" },
    ],
  },
  "11": {
    id: "11",
    name: "Extract Key Data",
    description: "Pull structured data from agreements into a standardized extraction table.",
    category: "Transactional",
    outputType: "extraction",
    columnCount: 12,
    isSystem: true,
    steps: [
      { id: "11-1", order: 1, name: "Upload Agreements", action: "input" },
      { id: "11-2", order: 2, name: "Parse Documents", action: "process" },
      { id: "11-3", order: 3, name: "Extract Data Points", action: "output" },
    ],
  },
  "12": {
    id: "12",
    name: "Extract Terms from Agreements",
    description: "Identify and extract key terms and definitions from legal agreements into a review table.",
    category: "Transactional",
    outputType: "review_table",
    columnCount: 6,
    isSystem: true,
    steps: [
      { id: "12-1", order: 1, name: "Upload Agreements", action: "input" },
      { id: "12-2", order: 2, name: "Identify Definitions", action: "process" },
      { id: "12-3", order: 3, name: "Extract Terms", action: "output" },
    ],
  },
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
}

type ExecutionStatus = "idle" | "running" | "completed" | "failed"

function OutputTypeIcon({ type, className }: { type: WorkflowOutputType; className?: string }) {
  switch (type) {
    case "draft":
      return <FileText className={className} />
    case "review_table":
      return <Table2 className={className} />
    case "extraction":
      return <Layers className={className} />
    case "transformation":
      return <ArrowRightLeft className={className} />
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

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>("idle")
  const [currentStep, setCurrentStep] = useState(0)
  const [output, setOutput] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const workflow = mockWorkflows[id]

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])
    e.target.value = "" // Reset input
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (!files) return

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }, [])

  const executeWorkflow = useCallback(async () => {
    if (uploadedFiles.length === 0 || !workflow) return

    setExecutionStatus("running")
    setCurrentStep(0)
    setOutput(null)

    // Simulate step-by-step execution
    for (let i = 0; i < workflow.steps.length; i++) {
      setCurrentStep(i)
      // Simulate processing time per step
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    // Mark as completed
    setCurrentStep(workflow.steps.length)
    setExecutionStatus("completed")

    // Mock output based on workflow type
    if (workflow.outputType === "draft") {
      setOutput(
        `# ${workflow.name} Output\n\nBased on the ${uploadedFiles.length} document(s) provided, here is the generated draft:\n\n## Summary\n\nThis is a mock output demonstrating the workflow execution. In a production environment, this would contain the actual AI-generated content based on your uploaded documents.\n\n## Key Points\n\n- Point 1 extracted from documents\n- Point 2 extracted from documents\n- Point 3 extracted from documents\n\n## Conclusion\n\nThe workflow has completed processing your documents.`
      )
    } else if (workflow.outputType === "review_table") {
      setOutput(
        `| Document | Provision | Terms | Status | Notes |\n|----------|-----------|-------|--------|-------|\n| ${uploadedFiles[0]?.name || "Doc 1"} | Change of Control | 30 days notice | Active | Standard terms |\n| ${uploadedFiles[1]?.name || "Doc 2"} | Assignment | Consent required | Active | Restrictive |\n| ${uploadedFiles[2]?.name || "Doc 3"} | Termination | 60 days | Pending | Review needed |`
      )
    } else {
      setOutput(
        `# Extraction Results\n\n| Field | Value |\n|-------|-------|\n| Date | 2025-01-15 |\n| Parties | Party A, Party B |\n| Amount | $1,000,000 |\n| Term | 3 years |`
      )
    }
  }, [uploadedFiles, workflow])

  const resetWorkflow = useCallback(() => {
    setExecutionStatus("idle")
    setCurrentStep(0)
    setOutput(null)
  }, [])

  if (!workflow) {
    return (
      <>
        <PageHeader title="Workflow Not Found" />
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">The requested workflow does not exist.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/workflows")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workflows
          </Button>
        </div>
      </>
    )
  }

  const outputType = workflow.outputType
  const isRunning = executionStatus === "running"
  const isCompleted = executionStatus === "completed"
  const canExecute = uploadedFiles.length > 0 && !isRunning

  return (
    <>
      <PageHeader title={workflow.name} />

      <div className="flex flex-col gap-6">
        {/* Back button and header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/workflows")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-semibold">{workflow.name}</h1>
                <Badge variant="outline" className="gap-1">
                  <OutputTypeIcon type={outputType} className="h-3 w-3" />
                  {getOutputTypeLabel(outputType)}
                </Badge>
                {workflow.isSystem && (
                  <Badge variant="secondary">System</Badge>
                )}
              </div>
              <p className="text-muted-foreground max-w-2xl">{workflow.description}</p>
            </div>
          </div>

          <Button
            onClick={isCompleted ? resetWorkflow : executeWorkflow}
            disabled={!canExecute && !isCompleted}
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : isCompleted ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Again
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Execute
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow Steps</CardTitle>
              <CardDescription>
                {workflow.steps.length} steps to completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflow.steps.map((step, index) => {
                  const isActive = isRunning && currentStep === index
                  const isComplete = isRunning
                    ? currentStep > index
                    : isCompleted
                  const isPending = !isActive && !isComplete

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isActive
                          ? "border-primary bg-primary/5"
                          : isComplete
                          ? "border-green-500/50 bg-green-500/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isComplete ? (
                          <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        ) : isActive ? (
                          <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                            <Circle className="h-3 w-3 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            isPending ? "text-muted-foreground" : ""
                          }`}
                        >
                          {step.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {step.action}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Right column: File upload and output */}
          <div className="lg:col-span-2 space-y-6">
            {/* File upload area */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Input Documents</CardTitle>
                <CardDescription>
                  Upload the documents required for this workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${isRunning ? "pointer-events-none opacity-50" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">
                    Drag and drop files here
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isRunning}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    disabled={isRunning}
                  >
                    Choose Files
                  </Button>
                </div>

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">
                      {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} selected
                    </p>
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-2 rounded border bg-muted/30"
                      >
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                        {!isRunning && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Output area */}
            {(isCompleted || output) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <OutputTypeIcon type={outputType} className="h-4 w-4" />
                    Output
                  </CardTitle>
                  <CardDescription>
                    {getOutputTypeLabel(outputType)} generated by workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap bg-muted/50 p-4 rounded-lg text-sm font-mono overflow-auto max-h-96">
                      {output}
                    </pre>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      Copy to clipboard
                    </Button>
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
