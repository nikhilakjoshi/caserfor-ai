"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Check, Loader2, Sparkles, X } from "lucide-react"
import type { Recommender } from "./recommender-list"

interface AISuggestionsPanelProps {
  clientId: string
  recommenders: Recommender[]
  onAccept: (recommender: Recommender) => void
  onDismiss: (recommenderId: string) => void
}

export function AISuggestionsPanel({
  clientId,
  recommenders,
  onAccept,
  onDismiss,
}: AISuggestionsPanelProps) {
  const [triggering, setTriggering] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggestions = recommenders.filter(
    (r) =>
      r.status === "suggested" &&
      (r.sourceType === "ai_suggested" || r.sourceType === "linkedin_extract")
  )

  const handleSuggest = async () => {
    setTriggering(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/cases/${clientId}/recommenders/suggest`,
        { method: "POST" }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to trigger suggestions")
      }
      setPolling(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger suggestions")
    } finally {
      setTriggering(false)
    }
  }

  // Poll for new suggestions after triggering
  const checkForNewSuggestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${clientId}/recommenders`)
      if (!res.ok) return
      const data: Recommender[] = await res.json()
      const newSuggestions = data.filter(
        (r) => r.status === "suggested" && r.sourceType === "ai_suggested"
      )
      if (newSuggestions.length > suggestions.length) {
        setPolling(false)
        // Parent will re-fetch and update recommenders prop
        window.dispatchEvent(new CustomEvent("recommenders-updated"))
      }
    } catch {
      // ignore poll errors
    }
  }, [clientId, suggestions.length])

  useEffect(() => {
    if (!polling) return
    const interval = setInterval(checkForNewSuggestions, 5000)
    // Auto-stop polling after 2 minutes
    const timeout = setTimeout(() => setPolling(false), 120000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [polling, checkForNewSuggestions])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">AI Suggestions</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSuggest}
          disabled={triggering || polling}
        >
          {triggering || polling ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="mr-1 h-3 w-3" />
          )}
          {polling ? "Generating..." : "Suggest Recommenders"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {polling && suggestions.length === 0 && (
        <div className="flex items-center justify-center py-6">
          <div className="text-center space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              AI is analyzing the case and suggesting recommenders...
            </p>
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((rec) => (
            <SuggestionCard
              key={rec.id}
              recommender={rec}
              onAccept={() => onAccept(rec)}
              onDismiss={() => onDismiss(rec.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SuggestionCard({
  recommender,
  onAccept,
  onDismiss,
}: {
  recommender: Recommender
  onAccept: () => void
  onDismiss: () => void
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm">{recommender.name}</CardTitle>
            {(recommender.title || recommender.organization) && (
              <CardDescription className="text-xs">
                {[recommender.title, recommender.organization]
                  .filter(Boolean)
                  .join(" at ")}
              </CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {recommender.sourceType === "linkedin_extract"
              ? "LinkedIn"
              : "AI"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommender.aiReasoning && (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {recommender.aiReasoning}
          </p>
        )}

        {recommender.criteriaRelevance.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recommender.criteriaRelevance.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1" onClick={onAccept}>
            <Check className="mr-1 h-3 w-3" />
            Accept
          </Button>
          <Button size="sm" variant="ghost" className="flex-1" onClick={onDismiss}>
            <X className="mr-1 h-3 w-3" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
