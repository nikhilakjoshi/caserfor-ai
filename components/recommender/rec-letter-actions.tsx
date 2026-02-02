"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sparkles, RotateCcw, Save, Upload, X, Send } from "lucide-react"

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

interface RecLetterActionsProps {
  draft: Draft
  recommender: ActionsRecommender
  clientId: string
  onGenerate: () => void
  onRegenSection: (sectionId: string, instruction?: string) => void
  sections: Section[]
  isStreaming: boolean
  editorContent: string
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
}: RecLetterActionsProps) {
  const hasContent = editorContent.length > 0
  const isGenerating = draft.status === "generating" || isStreaming
  const [regenSectionId, setRegenSectionId] = useState<string | null>(null)
  const [regenInstruction, setRegenInstruction] = useState("")

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

      {/* Version history placeholder */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2">
          Versions
        </h4>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!hasContent || isGenerating}
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          Save Version
        </Button>
      </div>

      <Separator />

      {/* Add to Vault */}
      <div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!hasContent || isGenerating || draft.status === "not_started"}
          title={!hasContent ? "Generate a letter first" : undefined}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Add to Vault
        </Button>
      </div>
    </div>
  )
}
