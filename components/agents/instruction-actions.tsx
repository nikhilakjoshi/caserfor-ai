"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Wand2, Sparkles, Loader2 } from "lucide-react"

interface InstructionActionsProps {
  currentValue: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function InstructionActions({
  currentValue,
  onChange,
  disabled,
}: InstructionActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [roughIdea, setRoughIdea] = useState("")

  const streamInstruction = async (mode: "generate" | "improve", text: string) => {
    const setter = mode === "generate" ? setIsGenerating : setIsImproving
    setter(true)

    try {
      const res = await fetch("/api/agents/generate-instruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text }),
      })

      if (!res.ok) throw new Error("Failed to generate")

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let result = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
        onChange(result)
      }
    } catch (err) {
      console.error("Instruction generation error:", err)
    } finally {
      setter(false)
    }
  }

  const handleGenerate = () => {
    if (!roughIdea.trim()) return
    setGenerateOpen(false)
    streamInstruction("generate", roughIdea.trim())
    setRoughIdea("")
  }

  const handleImprove = () => {
    if (!currentValue.trim()) return
    streamInstruction("improve", currentValue)
  }

  const busy = isGenerating || isImproving

  return (
    <>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || busy}
          onClick={() => setGenerateOpen(true)}
        >
          {isGenerating ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="mr-1 h-3.5 w-3.5" />
          )}
          Generate
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || busy || !currentValue.trim()}
          onClick={handleImprove}
        >
          {isImproving ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1 h-3.5 w-3.5" />
          )}
          Improve
        </Button>
      </div>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate System Instruction</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Describe what the agent should do, e.g. 'Review contracts and flag risky clauses'"
            value={roughIdea}
            onChange={(e) => setRoughIdea(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={!roughIdea.trim()}>
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
