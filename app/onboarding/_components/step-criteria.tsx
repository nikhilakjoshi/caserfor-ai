"use client"

import { useState, useEffect, useCallback } from "react"
import { CRITERIA_QUESTIONS } from "@/app/onboarding/_lib/criteria-questions"
import { CriteriaTab } from "./criteria-tab"
import { Loader2 } from "lucide-react"

interface Props {
  clientId: string
}

interface CriterionResponseData {
  criterion: string
  responses: Record<string, unknown>
}

export function StepCriteria({ clientId }: Props) {
  const [activeTab, setActiveTab] = useState(CRITERIA_QUESTIONS[0].slug)
  const [responses, setResponses] = useState<Record<string, Record<string, unknown>>>({})
  const [loading, setLoading] = useState(true)

  const loadResponses = useCallback(async () => {
    try {
      const res = await fetch(`/api/onboarding/${clientId}/criteria`)
      if (!res.ok) throw new Error("Failed to load")
      const data: CriterionResponseData[] = await res.json()
      const map: Record<string, Record<string, unknown>> = {}
      for (const cr of data) {
        map[cr.criterion] = cr.responses as Record<string, unknown>
      }
      setResponses(map)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    loadResponses()
  }, [loadResponses])

  function handleSave(criterion: string, data: Record<string, unknown>) {
    setResponses((prev) => ({ ...prev, [criterion]: data }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">EB1A Criteria</h2>
        <p className="text-sm text-muted-foreground">
          Provide details for each applicable criterion. You don&apos;t need to fill all 10.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Vertical tabs */}
        <div className="w-48 shrink-0 space-y-0.5">
          {CRITERIA_QUESTIONS.map((c) => {
            const hasData = responses[c.slug] && Object.values(responses[c.slug]).some((v) => v)
            return (
              <button
                key={c.slug}
                onClick={() => setActiveTab(c.slug)}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                  activeTab === c.slug
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <span className="flex items-center justify-between">
                  {c.label}
                  {hasData && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  )}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {CRITERIA_QUESTIONS.map((c) =>
            activeTab === c.slug ? (
              <CriteriaTab
                key={c.slug}
                config={c}
                clientId={clientId}
                initialResponses={responses[c.slug] || {}}
                onSave={(data) => handleSave(c.slug, data)}
              />
            ) : null
          )}
        </div>
      </div>
    </div>
  )
}
