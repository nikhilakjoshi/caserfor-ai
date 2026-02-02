"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardChatProps {
  prefillText?: string
}

export function DashboardChat({ prefillText }: DashboardChatProps) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/lawyer/assistant" }),
    [],
  )

  const { messages, sendMessage, status } = useChat({ transport })
  const [input, setInput] = useState("")

  const isStreaming = status === "streaming"
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Apply prefill from parent (quick action buttons)
  const [appliedPrefill, setAppliedPrefill] = useState("")
  if (prefillText && prefillText !== appliedPrefill) {
    setAppliedPrefill(prefillText)
    setInput(prefillText)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input })
    setInput("")
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto rounded-md border p-4">
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
                  "text-sm whitespace-pre-wrap",
                  msg.role === "user"
                    ? "text-right text-muted-foreground"
                    : "text-left",
                )}
              >
                {text}
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Ask about your cases..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
          disabled={isStreaming}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!input.trim() || isStreaming}
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
