"use client"

import { useRef, useEffect } from "react"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"

interface RecLetterChatProps {
  messages: UIMessage[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  isStreaming: boolean
  criteriaRelevance?: string[]
}

const SUGGESTION_CHIPS = [
  "Make more formal",
  "Add more specific examples",
  "Shorten letter",
]

export function RecLetterChat({
  messages,
  input,
  onInputChange,
  onSend,
  isStreaming,
  criteriaRelevance,
}: RecLetterChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasMessages = messages.length > 0

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isStreaming) onSend()
    }
  }

  const handleChipClick = (text: string) => {
    onInputChange(text)
    // Auto-send after a tick so the input is set
    setTimeout(() => onSend(), 0)
  }

  // Build dynamic chips from criteria
  const dynamicChips = [
    ...SUGGESTION_CHIPS,
    ...(criteriaRelevance?.slice(0, 2).map((c) => `Strengthen ${c} section`) ??
      []),
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {!hasMessages && (
          <p className="text-xs text-muted-foreground">
            Chat with AI to refine the letter.
          </p>
        )}
        {messages.map((msg) => {
          const text = msg.parts
            .filter(
              (p): p is Extract<typeof p, { type: "text" }> =>
                p.type === "text",
            )
            .map((p) => p.text)
            .join("")
          if (!text) return null
          return (
            <div
              key={msg.id}
              className={cn(
                "text-xs rounded p-2 whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-primary/10 ml-4"
                  : "bg-muted mr-4",
              )}
            >
              {text}
            </div>
          )
        })}
        {isStreaming && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground p-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips -- hide after first exchange */}
      {!hasMessages && (
        <div className="flex flex-wrap gap-1 mb-2">
          {dynamicChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              disabled={isStreaming}
              className="text-[10px] px-2 py-1 rounded-full border bg-background hover:bg-accent transition-colors disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-1">
        <Textarea
          placeholder="Ask to refine the letter..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          className="min-h-[60px] max-h-[100px] text-xs resize-none flex-1"
          rows={2}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={onSend}
          disabled={!input.trim() || isStreaming}
          className="self-end"
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
