"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sparkles, RotateCcw, Save, Upload, X, Send, Clock, ChevronDown } from "lucide-react"

interface Draft {
  id: string
  status: string
  content: unknown
  plainText: string | null
  sections: unknown
}

interface ActionsRecommender {
  id: string
  name: string
  title?: string | null
  organization?: string | null
  relationship?: string | null
  criteriaRelevance: string[]
  aiReasoning?: string | null
}

interface Section {
  id: string
  heading: string
}

interface VersionEntry {
  id: string
  versionNote: string | null
  createdAt: string
}

interface RecLetterActionsProps {
  draft: Draft
  recommender: ActionsRecommender
  clientId: string
  onGenerate: () => void
  onRegenSection: (sectionId: string, instruction?: string) => void
  sections: Section[]
  isStreaming: boolean
  editorContent: string
  onSaveVersion: (note?: string) => Promise<void>
  onRestoreVersion: (versionId: string) => void
  versions: VersionEntry[]
  isSavingVersion: boolean
  onAddToVault: () => Promise<void>
  isAddingToVault: boolean
}

export function RecLetterActions({
  draft,
  recommender,
  clientId: _clientId,
  onGenerate,
  onRegenSection,
  sections,
  isStreaming,
  editorContent,
  onSaveVersion,
  onRestoreVersion,
  versions,
  isSavingVersion,
  onAddToVault,
  isAddingToVault,
}: RecLetterActionsProps) {
  const hasContent = editorContent.length > 0
  const isGenerating = draft.status === "generating" || isStreaming
  const [regenSectionId, setRegenSectionId] = useState<string | null>(null)
  const [regenInstruction, setRegenInstruction] = useState("")
  const [showVersions, setShowVersions] = useState(false)
  const [versionNote, setVersionNote] = useState("")
  const [showNoteInput, setShowNoteInput] = useState(false)

  return (
    <div className="space-y-3">
      {/* Recommender context card */}
      <div className="rounded border p-2 space-y-1">
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
        {recommender.aiReasoning && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
            {recommender.aiReasoning}
          </p>
        )}
      </div>

      <Separator />

      {/* Generate Full Letter */}
      <div>
        <Button
          size="sm"
          className="w-full"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          {isGenerating ? "Generating..." : "Generate Full Letter"}
        </Button>
      </div>

      <Separator />

      {/* Section list */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2">
          Sections
        </h4>
        {sections.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {hasContent ? "No sections detected." : "Generate a letter to see sections."}
          </p>
        ) : (
          <div className="space-y-1">
            {sections.map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between text-xs rounded px-2 py-1.5 hover:bg-muted">
                  <span className="truncate">{s.heading}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    disabled={isGenerating}
                    title="Regenerate section"
                    onClick={() =>
                      setRegenSectionId(regenSectionId === s.id ? null : s.id)
                    }
                  >
                    {regenSectionId === s.id ? (
                      <X className="h-3 w-3" />
                    ) : (
                      <RotateCcw className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                {regenSectionId === s.id && (
                  <div className="px-2 pb-1.5 space-y-1">
                    <textarea
                      className="w-full text-xs border rounded p-1.5 resize-none bg-background"
                      rows={2}
                      placeholder="Optional instruction..."
                      value={regenInstruction}
                      onChange={(e) => setRegenInstruction(e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-6 text-xs"
                      disabled={isGenerating}
                      onClick={() => {
                        onRegenSection(s.id, regenInstruction || undefined)
                        setRegenSectionId(null)
                        setRegenInstruction("")
                      }}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Version history */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2">
          Versions
        </h4>
        {showNoteInput ? (
          <div className="space-y-1.5">
            <input
              className="w-full text-xs border rounded px-2 py-1.5 bg-background"
              placeholder="Version note (optional)"
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSaveVersion(versionNote || undefined)
                  setVersionNote("")
                  setShowNoteInput(false)
                }
              }}
            />
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-6 text-xs"
                disabled={isSavingVersion}
                onClick={() => {
                  onSaveVersion(versionNote || undefined)
                  setVersionNote("")
                  setShowNoteInput(false)
                }}
              >
                {isSavingVersion ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setShowNoteInput(false)
                  setVersionNote("")
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!hasContent || isGenerating || isSavingVersion}
            onClick={() => setShowNoteInput(true)}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save Version
          </Button>
        )}

        {versions.length > 0 && (
          <div className="mt-2">
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full"
              onClick={() => setShowVersions(!showVersions)}
            >
              <Clock className="h-3 w-3" />
              <span>{versions.length} version{versions.length !== 1 ? "s" : ""}</span>
              <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${showVersions ? "rotate-180" : ""}`} />
            </button>
            {showVersions && (
              <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                {versions.map((v) => (
                  <button
                    key={v.id}
                    className="w-full text-left text-xs rounded px-2 py-1.5 hover:bg-muted"
                    onClick={() => onRestoreVersion(v.id)}
                  >
                    <div className="text-foreground">
                      {v.versionNote || "Untitled version"}
                    </div>
                    <div className="text-muted-foreground text-[10px]">
                      {new Date(v.createdAt).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Add to Vault */}
      <div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!hasContent || isGenerating || isAddingToVault || draft.status === "not_started"}
          title={!hasContent ? "Generate a letter first" : undefined}
          onClick={onAddToVault}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          {isAddingToVault ? "Adding..." : "Add to Vault"}
        </Button>
      </div>
    </div>
  )
}
