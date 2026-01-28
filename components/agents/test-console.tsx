"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, RotateCcw, Bot, User } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface TestConsoleProps {
  instruction: string
  disabled?: boolean
}

export function TestConsole({ instruction, disabled = false }: TestConsoleProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevInstructionRef = useRef(instruction)

  // Reset conversation when instruction changes
  useEffect(() => {
    if (prevInstructionRef.current !== instruction) {
      setMessages([])
      prevInstructionRef.current = instruction
    }
  }, [instruction])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming || disabled) return

    const userMessage: Message = { role: "user", content: trimmed }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsStreaming(true)

    try {
      const res = await fetch("/api/agents/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error("Failed to get response")

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let assistantContent = ""

      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value, { stream: true })
        const currentContent = assistantContent
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: currentContent }
          return updated
        })
      }
    } catch (err) {
      console.error("Test console error:", err)
      setMessages((prev) => [
        ...prev,
        ...(prev[prev.length - 1]?.role === "assistant" ? [] : []),
        { role: "assistant" as const, content: "Error: Failed to get response. Check your API key." },
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  const handleReset = () => {
    setMessages([])
    setInput("")
  }

  return (
    <div className="flex flex-col h-full border rounded bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium text-muted-foreground">Test Console</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={handleReset}
          disabled={messages.length === 0 || isStreaming}
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Send a message to test your agent</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 mt-0.5">
                <div className="rounded-md bg-muted p-1.5">
                  <Bot className="h-3 w-3" />
                </div>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50"
              }`}
            >
              {msg.content || (isStreaming && i === messages.length - 1 ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null)}
            </div>
            {msg.role === "user" && (
              <div className="flex-shrink-0 mt-0.5">
                <div className="rounded-md bg-primary/10 p-1.5">
                  <User className="h-3 w-3" />
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-2">
        <div className="flex gap-2">
          <Textarea
            placeholder={disabled ? "Fill in all required fields to test" : "Type a test message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={isStreaming || disabled}
          />
          <Button
            size="sm"
            className="h-[40px] px-3"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || disabled}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
