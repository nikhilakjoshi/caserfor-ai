"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TestConsole } from "@/components/agents/test-console"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewAgentPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [instruction, setInstruction] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = name.trim().length > 0 && instruction.trim().length > 0

  const handleSave = async () => {
    if (!isValid || isSaving) return
    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          instruction: instruction.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create agent")
      }

      router.push("/agents")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Create Agent" />

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
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
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

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={!isValid || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Agent"
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/agents">Cancel</Link>
            </Button>
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
