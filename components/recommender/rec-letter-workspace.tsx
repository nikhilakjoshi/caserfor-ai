"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DocumentEditor } from "@/components/editor/document-editor"

interface TiptapDoc {
  type: string
  content: Record<string, unknown>[]
}

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

// Convert TipTap JSON to HTML for the editor
function tiptapToHtml(doc: unknown): string {
  if (!doc || typeof doc !== "object") return ""
  const d = doc as TiptapDoc
  if (!d.content) return ""
  return renderNodes(d.content)
}

function renderNodes(nodes: Record<string, unknown>[]): string {
  return nodes.map(renderNode).join("")
}

function renderNode(node: Record<string, unknown>): string {
  const type = node.type as string
  const attrs = node.attrs as Record<string, unknown> | undefined
  const content = node.content as Record<string, unknown>[] | undefined
  const marks = node.marks as { type: string; attrs?: Record<string, unknown> }[] | undefined
  const text = node.text as string | undefined

  if (type === "text") {
    let t = text ?? ""
    t = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    if (marks) {
      for (const mark of marks) {
        if (mark.type === "bold") t = `<strong>${t}</strong>`
        if (mark.type === "italic") t = `<em>${t}</em>`
        if (mark.type === "underline") t = `<u>${t}</u>`
        if (mark.type === "strike") t = `<s>${t}</s>`
        if (mark.type === "link") t = `<a href="${mark.attrs?.href ?? "#"}">${t}</a>`
      }
    }
    return t
  }

  const inner = content ? renderNodes(content) : ""

  switch (type) {
    case "doc":
      return inner
    case "paragraph":
      return `<p>${inner}</p>`
    case "heading": {
      const level = (attrs?.level as number) ?? 2
      const id = attrs?.id as string | undefined
      return `<h${level}${id ? ` id="${id}"` : ""}>${inner}</h${level}>`
    }
    case "bulletList":
      return `<ul>${inner}</ul>`
    case "orderedList":
      return `<ol>${inner}</ol>`
    case "listItem":
      return `<li>${inner}</li>`
    case "blockquote":
      return `<blockquote>${inner}</blockquote>`
    case "codeBlock":
      return `<pre><code>${inner}</code></pre>`
    case "hardBreak":
      return "<br>"
    default:
      return inner
  }
}

export function RecLetterWorkspace({
  draft,
  recommender,
  clientId,
  onBack,
}: RecLetterWorkspaceProps) {
  // Initialize editor content from TipTap JSON or plainText fallback
  const initialHtml = tiptapToHtml(draft.content) || draft.plainText || ""

  const [editorContent, setEditorContent] = useState(initialHtml)
  const [isStreaming, setIsStreaming] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([])
  const [draftStatus, setDraftStatus] = useState(draft.status)

  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const savingRef = useRef(false)

  // Auto-save with 2s debounce
  const saveDraft = useCallback(async (html: string) => {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      await fetch(`/api/cases/${clientId}/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plainText: html }),
      })
      setDirty(false)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [clientId, draft.id])

  const handleEditorChange = useCallback((html: string) => {
    setEditorContent(html)
    setDirty(true)
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      saveDraft(html)
    }, 2000)
  }, [saveDraft])

  // Cleanup auto-save timer
  useEffect(() => {
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    }
  }, [])

  // Poll for generation completion when status is 'generating'
  useEffect(() => {
    if (draftStatus === "generating") {
      setIsStreaming(true)
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/cases/${clientId}/drafts/${draft.id}`)
          if (!res.ok) return
          const data = await res.json()
          if (data.status !== "generating") {
            setDraftStatus(data.status)
            setIsStreaming(false)
            const html = tiptapToHtml(data.content) || data.plainText || ""
            setEditorContent(html)
            if (pollRef.current) clearInterval(pollRef.current)
          }
        } catch {
          // non-critical, keep polling
        }
      }, 2000)
    } else {
      setIsStreaming(false)
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [draftStatus, clientId, draft.id])

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Back to Recommenders</span>
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h2 className="text-sm font-semibold truncate">
            Drafting: {recommender.name}
          </h2>
          {saving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving
            </span>
          )}
          {dirty && !saving && (
            <span className="text-xs text-muted-foreground">Unsaved</span>
          )}
        </div>
        <Badge
          variant="secondary"
          className={statusColors[draftStatus] || ""}
        >
          {statusLabels[draftStatus] || draftStatus}
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
        <div className="w-2/4 rounded-lg border bg-card overflow-y-auto flex flex-col">
          {editorContent || isStreaming ? (
            <div className="flex-1 relative">
              {isStreaming && (
                <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating letter...
                  </div>
                </div>
              )}
              <DocumentEditor
                content={editorContent}
                onChange={handleEditorChange}
                editable={!isStreaming}
                isStreaming={isStreaming}
                placeholder="Click 'Generate Full Letter' in the actions panel to get started."
                className="border-0 rounded-none h-full"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-sm text-muted-foreground text-center">
                Click &quot;Generate Full Letter&quot; in the actions panel to get started.
              </p>
            </div>
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
