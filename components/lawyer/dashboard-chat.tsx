"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

interface DashboardChatProps {
  prefillText?: string
}

export function DashboardChat({ prefillText }: DashboardChatProps) {
  const [input, setInput] = useState(prefillText ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    // D5 will wire this to /api/lawyer/assistant
    alert("Dashboard assistant coming soon")
    setInput("")
  }

  // Allow parent to update prefill
  if (prefillText !== undefined && prefillText !== input && input === "") {
    setInput(prefillText)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto w-full">
      <Input
        placeholder="Ask about your cases..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" size="sm" disabled={!input.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
