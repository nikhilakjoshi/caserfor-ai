"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Draft {
  id: string
  status: string
  content: unknown
  plainText: string | null
  sections: unknown
}

interface WorkspaceRecommender {
  id: string
  name: string
  title?: string | null
  organization?: string | null
  relationship?: string | null
  criteriaRelevance: string[]
  aiReasoning?: string | null
}

interface RecLetterWorkspaceProps {
  draft: Draft
  recommender: WorkspaceRecommender
  clientId: string
  onBack: () => void
}

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  generating: "Generating",
  draft: "Draft",
  in_review: "In Review",
  final: "Final",
}

const statusColors: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",
  generating: "bg-blue-100 text-blue-700",
  draft: "bg-yellow-100 text-yellow-700",
  in_review: "bg-purple-100 text-purple-700",
  final: "bg-green-100 text-green-700",
}

export function RecLetterWorkspace({
  draft,
  recommender,
  clientId,
  onBack,
}: RecLetterWorkspaceProps) {
  // State wired in subsequent PRD items (editor, chat, actions panels)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editorContent, setEditorContent] = useState(draft.plainText || "")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isStreaming, setIsStreaming] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([])
  void clientId // used by child panels in subsequent PRD items

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Back to Recommenders</span>
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">
            Drafting: {recommender.name}
          </h2>
        </div>
        <Badge
          variant="secondary"
          className={statusColors[draft.status] || ""}
        >
          {statusLabels[draft.status] || draft.status}
        </Badge>
      </div>

      {/* 3-panel layout */}
      <div className="flex gap-3 h-[calc(100vh-180px)]">
        {/* Left: Chat */}
        <div className="w-1/4 rounded-lg border bg-card overflow-y-auto p-3">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            Chat
          </h3>
          <div className="space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Chat with AI to refine the letter. Coming soon.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-xs rounded p-2 ${
                  msg.role === "user"
                    ? "bg-primary/10 ml-4"
                    : "bg-muted mr-4"
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>
        </div>

        {/* Center: Editor */}
        <div className="w-2/4 rounded-lg border bg-card overflow-y-auto p-3">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            Editor
          </h3>
          {editorContent ? (
            <div className="prose prose-sm max-w-none text-sm">
              <p className="text-xs text-muted-foreground">
                Editor content loaded. Full editor integration coming next.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Click &quot;Generate Full Letter&quot; in the actions panel to get
              started.
            </p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="w-1/4 rounded-lg border bg-card overflow-y-auto p-3">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            Actions
          </h3>
          {/* Recommender context card */}
          <div className="rounded border p-2 space-y-1 mb-3">
            <p className="text-xs font-medium">{recommender.name}</p>
            {recommender.title && (
              <p className="text-xs text-muted-foreground">
                {recommender.title}
                {recommender.organization && ` at ${recommender.organization}`}
              </p>
            )}
            {recommender.relationship && (
              <p className="text-xs text-muted-foreground">
                {recommender.relationship}
              </p>
            )}
            {recommender.criteriaRelevance.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {recommender.criteriaRelevance.map((c) => (
                  <Badge key={c} variant="outline" className="text-[10px] px-1 py-0">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Generate, version history, and add-to-vault actions coming next.
          </p>
        </div>
      </div>
    </div>
  )
}
