"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TestConsole } from "@/components/agents/test-console"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Agent {
  id: string
  name: string
  slug: string
  description: string | null
  instruction: string
}

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [instruction, setInstruction] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Track initial values for unsaved changes detection
  const initialRef = useRef({ name: "", description: "", instruction: "" })

  const hasUnsavedChanges =
    agent !== null &&
    (name !== initialRef.current.name ||
      description !== initialRef.current.description ||
      instruction !== initialRef.current.instruction)

  const isValid = name.trim().length > 0 && instruction.trim().length > 0

  const fetchAgent = useCallback(async () => {
    try {
      setIsLoading(true)
      setFetchError(null)
      const res = await fetch(`/api/agents/${id}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error("Agent not found")
        throw new Error("Failed to fetch agent")
      }
      const data = await res.json()
      setAgent(data)
      setName(data.name)
      setDescription(data.description || "")
      setInstruction(data.instruction)
      initialRef.current = {
        name: data.name,
        description: data.description || "",
        instruction: data.instruction,
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load agent")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAgent()
  }, [fetchAgent])

  // Warn on navigate away with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasUnsavedChanges])

  const handleSave = async () => {
    if (!isValid || isSaving) return
    setIsSaving(true)
    setSaveError(null)

    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          instruction: instruction.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update agent")
      }

      const updated = await res.json()
      setAgent(updated)
      initialRef.current = {
        name: updated.name,
        description: updated.description || "",
        instruction: updated.instruction,
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Edit Agent" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  if (fetchError) {
    return (
      <>
        <PageHeader title="Edit Agent" />
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{fetchError}</p>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/agents">Back to Agents</Link>
            </Button>
            <Button onClick={fetchAgent}>Retry</Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Edit Agent" />

      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agents">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Agents
          </Link>
        </Button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        {/* Config panel */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {saveError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {saveError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Contract Reviewer"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does this agent do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>

          <div className="space-y-2 flex-1 flex flex-col">
            <Label htmlFor="instruction">System Instruction <span className="text-destructive">*</span></Label>
            <Textarea
              id="instruction"
              placeholder="You are a legal assistant that..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="flex-1 min-h-[120px] resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} disabled={!isValid || isSaving || !hasUnsavedChanges}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button variant="outline" onClick={() => router.push("/agents")}>
              Cancel
            </Button>
            {hasUnsavedChanges && (
              <span className="text-xs text-muted-foreground ml-2">Unsaved changes</span>
            )}
          </div>
        </div>

        {/* Test console */}
        <div className="w-[400px] flex-shrink-0">
          <TestConsole instruction={instruction} disabled={!isValid} />
        </div>
      </div>
    </>
  )
}
