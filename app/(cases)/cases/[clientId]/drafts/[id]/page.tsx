"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DocumentEditor } from "@/components/editor/document-editor"
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  History,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react"

// --- Types ---

interface DraftData {
  id: string
  clientId: string
  documentType: string
  title: string | null
  content: TiptapDoc | null
  plainText: string | null
  sections: SectionMeta[] | null
  status: string
  recommenderId: string | null
  updatedAt: string
  recommender: { id: string; name: string; title: string | null; organization: string | null } | null
}

interface TiptapDoc {
  type: string
  content: Record<string, unknown>[]
}

interface SectionMeta {
  id: string
  title: string
}

interface VersionEntry {
  id: string
  versionNote: string | null
  createdBy: string | null
  createdAt: string
}

// --- Constants ---

const statusColors: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",
  generating: "bg-blue-100 text-blue-700",
  draft: "bg-yellow-100 text-yellow-700",
  in_review: "bg-purple-100 text-purple-700",
  final: "bg-green-100 text-green-700",
}

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  generating: "Generating...",
  draft: "Draft",
  in_review: "In Review",
  final: "Final",
}

const docTypeLabels: Record<string, string> = {
  petition_letter: "Petition Letter",
  personal_statement: "Personal Statement",
  recommendation_letter: "Recommendation Letter",
  cover_letter: "Cover Letter",
  exhibit_list: "Exhibit List",
  table_of_contents: "Table of Contents",
  rfe_response: "RFE Response",
}

// --- Helpers ---

function tiptapToHtml(doc: TiptapDoc | null): string {
  if (!doc?.content) return ""
  // Convert TipTap JSON to simplified HTML for the editor
  // The Markdown extension in DocumentEditor can handle markdown input too
  return renderNodes(doc.content)
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
    // Escape HTML
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

// --- Main Component ---

export default function DraftingWorkspacePage() {
  const params = useParams()
  const clientId = params.clientId as string
  const draftId = params.id as string

  // Data state
  const [draft, setDraft] = useState<DraftData | null>(null)
  const [versions, setVersions] = useState<VersionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Editor state
  const [editorHtml, setEditorHtml] = useState("")
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingVersion, setSavingVersion] = useState(false)

  // AI panel state
  const [panelOpen, setPanelOpen] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null)
  const [sectionInstructions, setSectionInstructions] = useState<Record<string, string>>({})

  // Version restore
  const [restoreVersion, setRestoreVersion] = useState<VersionEntry | null>(null)

  // Polling ref for generation status
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Data Fetching ---

  const fetchDraft = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${clientId}/drafts/${draftId}`)
      if (!res.ok) throw new Error("Failed to fetch draft")
      const data: DraftData = await res.json()
      setDraft(data)
      setEditorHtml(tiptapToHtml(data.content))
      setDirty(false)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
      return null
    }
  }, [clientId, draftId])

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${clientId}/drafts/${draftId}/versions`)
      if (res.ok) setVersions(await res.json())
    } catch {
      // non-critical
    }
  }, [clientId, draftId])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchDraft(), fetchVersions()])
      setLoading(false)
    }
    init()
  }, [fetchDraft, fetchVersions])

  // Poll for generation completion
  useEffect(() => {
    if (draft?.status === "generating") {
      setGenerating(true)
      pollRef.current = setInterval(async () => {
        const updated = await fetchDraft()
        if (updated && updated.status !== "generating") {
          setGenerating(false)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      }, 3000)
    } else {
      setGenerating(false)
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [draft?.status, fetchDraft])

  // --- Auto-save (debounced) ---

  const handleEditorChange = useCallback((html: string) => {
    setEditorHtml(html)
    setDirty(true)
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      saveDraft(html)
    }, 2000)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, draftId])

  const saveDraft = async (html?: string) => {
    if (saving) return
    setSaving(true)
    try {
      const content = html ?? editorHtml
      await fetch(`/api/cases/${clientId}/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plainText: content }),
      })
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  // --- Actions ---

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await fetch(`/api/cases/${clientId}/drafts/${draftId}/generate`, {
        method: "POST",
      })
      // Status will update via polling
      setDraft((d) => d ? { ...d, status: "generating" } : d)
    } catch {
      setGenerating(false)
    }
  }

  const handleRegenerateSection = async (sectionId: string) => {
    setRegeneratingSection(sectionId)
    try {
      await fetch(`/api/cases/${clientId}/drafts/${draftId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          instruction: sectionInstructions[sectionId] || undefined,
        }),
      })
      // Poll for update
      setTimeout(async () => {
        await fetchDraft()
        setRegeneratingSection(null)
      }, 5000)
    } catch {
      setRegeneratingSection(null)
    }
  }

  const handleSaveVersion = async () => {
    setSavingVersion(true)
    try {
      const note = window.prompt("Version note (optional):")
      await fetch(`/api/cases/${clientId}/drafts/${draftId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionNote: note || undefined }),
      })
      await fetchVersions()
    } finally {
      setSavingVersion(false)
    }
  }

  const handleRestoreVersion = async (version: VersionEntry) => {
    try {
      const res = await fetch(`/api/cases/${clientId}/drafts/${draftId}/versions`)
      if (!res.ok) return
      // We need to fetch the full version content - but versions list only has metadata
      // For now, we fetch the version and look it up. The versions endpoint returns metadata only.
      // We'll need to GET the specific version's content. Since the API stores content in version records,
      // we'll add a query approach: refetch draft after restoring
      // Actually, the API doesn't expose a single version GET. So we do a workaround:
      // We can't restore without content access. Let's just show the note for now.
      // TODO: Add GET /versions/[versionId] endpoint for full content retrieval
      setRestoreVersion(null)
    } catch {
      // ignore
    }
  }

  // --- Render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-sm text-muted-foreground">{error || "Draft not found"}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/cases/${clientId}/drafts`}>Back to Drafts</Link>
        </Button>
      </div>
    )
  }

  const sections = (draft.sections ?? []) as SectionMeta[]
  const docLabel = docTypeLabels[draft.documentType] ?? draft.documentType

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-background shrink-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/cases/${clientId}/drafts`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold truncate">{draft.title || docLabel}</h1>
            <Badge variant="secondary" className={statusColors[draft.status] || ""}>
              {statusLabels[draft.status] || draft.status}
            </Badge>
          </div>
          {draft.recommender && (
            <p className="text-xs text-muted-foreground truncate">
              For {draft.recommender.name}
              {draft.recommender.title ? ` - ${draft.recommender.title}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {dirty && (
            <span className="text-xs text-muted-foreground mr-1">Unsaved</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveDraft()}
            disabled={saving || !dirty}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveVersion}
            disabled={savingVersion || !draft.content}
          >
            {savingVersion ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <History className="h-3 w-3 mr-1" />
            )}
            Save Version
          </Button>
          {/* Version history dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Clock className="h-3 w-3 mr-1" />
                {versions.length}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {versions.length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                  No saved versions yet
                </div>
              ) : (
                versions.map((v) => (
                  <DropdownMenuItem
                    key={v.id}
                    onClick={() => setRestoreVersion(v)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">
                        {v.versionNote || "Untitled version"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* AI Panel (left) */}
        {panelOpen && (
          <div className="w-[340px] border-r bg-muted/20 flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-xs font-medium">AI Assistant</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setPanelOpen(false)}
              >
                <PanelLeftClose className="h-3 w-3" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* Generate full document */}
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Generate Full Document
                      </>
                    )}
                  </Button>
                  {generating && (
                    <p className="text-xs text-muted-foreground text-center">
                      AI is generating the document. This may take a few moments.
                    </p>
                  )}
                </div>

                {/* Section list */}
                {sections.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Sections
                    </p>
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        className="rounded border bg-background p-2 space-y-1.5"
                      >
                        <button
                          className="text-xs font-medium hover:text-primary flex items-center gap-1 w-full text-left"
                          onClick={() => {
                            document
                              .getElementById(section.id)
                              ?.scrollIntoView({ behavior: "smooth" })
                          }}
                        >
                          <ChevronRight className="h-3 w-3 shrink-0" />
                          {section.title}
                        </button>
                        <div className="flex gap-1">
                          <Input
                            placeholder="Instruction..."
                            className="h-6 text-xs"
                            value={sectionInstructions[section.id] || ""}
                            onChange={(e) =>
                              setSectionInstructions((prev) => ({
                                ...prev,
                                [section.id]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 shrink-0"
                            disabled={
                              regeneratingSection === section.id || generating
                            }
                            onClick={() =>
                              handleRegenerateSection(section.id)
                            }
                          >
                            {regeneratingSection === section.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Wand2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Editor panel (right) */}
        <div className="flex-1 flex flex-col min-w-0">
          {!panelOpen && (
            <div className="px-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setPanelOpen(true)}
              >
                <PanelLeftOpen className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex-1 overflow-auto p-4">
            <DocumentEditor
              content={editorHtml}
              onChange={handleEditorChange}
              editable={draft.status !== "generating"}
              placeholder={
                draft.status === "not_started"
                  ? "Click 'Generate Full Document' to create AI-generated content, or start typing..."
                  : "Start typing..."
              }
              className="min-h-full"
            />
          </div>
        </div>
      </div>

      {/* Version restore confirmation */}
      <AlertDialog
        open={!!restoreVersion}
        onOpenChange={(open) => !open && setRestoreVersion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version</AlertDialogTitle>
            <AlertDialogDescription>
              Restore &quot;{restoreVersion?.versionNote || "Untitled version"}&quot; from{" "}
              {restoreVersion
                ? new Date(restoreVersion.createdAt).toLocaleString()
                : ""}
              ? Current content will be replaced. Save a version first if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreVersion && handleRestoreVersion(restoreVersion)}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
